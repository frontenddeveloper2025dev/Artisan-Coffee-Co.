import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { table } from '@devvai/devv-code-backend'
import type { ProductWithInventory } from '@/types/coffee'

export interface CartItem {
  product: ProductWithInventory
  quantity: number
  reservationId?: string
  addedAt: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  reservationTimeouts: Map<string, NodeJS.Timeout>
  
  // Cart actions
  addItem: (product: ProductWithInventory, quantity?: number) => Promise<boolean>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<void>
  
  // UI actions
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  
  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (productId: string) => number
  
  // Reservation management
  reserveInventory: (productId: string, quantity: number) => Promise<string | null>
  releaseReservation: (reservationId: string) => Promise<void>
  refreshReservations: () => Promise<void>
}

const RESERVATION_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      reservationTimeouts: new Map(),

      addItem: async (product: ProductWithInventory, quantity = 1) => {
        const existingItem = get().items.find(item => item.product.product._id === product.product._id)
        const currentQuantity = existingItem?.quantity || 0
        const totalQuantity = currentQuantity + quantity
        
        // Check if enough inventory available
        const availableStock = product.available_stock
        if (totalQuantity > availableStock) {
          return false
        }

        // Reserve inventory
        const reservationId = await get().reserveInventory(product.product._id, quantity)
        if (!reservationId) {
          return false
        }

        set(state => {
          const newItems = existingItem 
            ? state.items.map(item =>
                item.product.product._id === product.product._id
                  ? { ...item, quantity: totalQuantity, reservationId }
                  : item
              )
            : [...state.items, {
                product,
                quantity,
                reservationId,
                addedAt: new Date().toISOString()
              }]
          
          return { items: newItems }
        })

        // Set timeout to release reservation
        const timeout = setTimeout(() => {
          get().releaseReservation(reservationId)
        }, RESERVATION_TIMEOUT)

        get().reservationTimeouts.set(reservationId, timeout)
        
        return true
      },

      removeItem: async (productId: string) => {
        const item = get().items.find(item => item.product.product._id === productId)
        if (item?.reservationId) {
          await get().releaseReservation(item.reservationId)
        }

        set(state => ({
          items: state.items.filter(item => item.product.product._id !== productId)
        }))
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId)
          return true
        }

        const item = get().items.find(item => item.product.product._id === productId)
        if (!item) return false

        const availableStock = item.product.available_stock + item.quantity
        if (quantity > availableStock) {
          return false
        }

        // Release old reservation
        if (item.reservationId) {
          await get().releaseReservation(item.reservationId)
        }

        // Make new reservation
        const reservationId = await get().reserveInventory(productId, quantity)
        if (!reservationId) {
          return false
        }

        set(state => ({
          items: state.items.map(item =>
            item.product.product._id === productId
              ? { ...item, quantity, reservationId }
              : item
          )
        }))

        return true
      },

      clearCart: async () => {
        const items = get().items
        
        // Release all reservations
        for (const item of items) {
          if (item.reservationId) {
            await get().releaseReservation(item.reservationId)
          }
        }

        set({ items: [] })
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => 
          total + (item.product.product.price * item.quantity), 0
        )
      },

      getItemCount: (productId: string) => {
        const item = get().items.find(item => item.product.product._id === productId)
        return item?.quantity || 0
      },

      reserveInventory: async (productId: string, quantity: number) => {
        try {
          // Create a reservation record in inventory
          const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          // Update reserved stock in inventory
          const inventoryResponse = await table.getItems('evn000r9yk8w', {
            query: { product_id: productId },
            limit: 1
          })

          if (inventoryResponse.items.length === 0) {
            return null
          }

          const inventory = inventoryResponse.items[0]
          const newReservedStock = inventory.reserved_stock + quantity

          await table.updateItem('evn000r9yk8w', {
            _uid: inventory._uid,
            _id: inventory._id,
            reserved_stock: newReservedStock,
            updated_at: new Date().toISOString()
          })

          return reservationId
        } catch (error) {
          console.error('Failed to reserve inventory:', error)
          return null
        }
      },

      releaseReservation: async (reservationId: string) => {
        try {
          const item = get().items.find(item => item.reservationId === reservationId)
          if (!item) return

          // Update reserved stock in inventory
          const inventoryResponse = await table.getItems('evn000r9yk8w', {
            query: { product_id: item.product.product._id },
            limit: 1
          })

          if (inventoryResponse.items.length > 0) {
            const inventory = inventoryResponse.items[0]
            const newReservedStock = Math.max(0, inventory.reserved_stock - item.quantity)

            await table.updateItem('evn000r9yk8w', {
              _uid: inventory._uid,
              _id: inventory._id,
              reserved_stock: newReservedStock,
              updated_at: new Date().toISOString()
            })
          }

          // Clear timeout
          const timeout = get().reservationTimeouts.get(reservationId)
          if (timeout) {
            clearTimeout(timeout)
            get().reservationTimeouts.delete(reservationId)
          }

          // Remove item from cart
          set(state => ({
            items: state.items.filter(item => item.reservationId !== reservationId)
          }))
        } catch (error) {
          console.error('Failed to release reservation:', error)
        }
      },

      refreshReservations: async () => {
        const items = get().items
        for (const item of items) {
          if (item.reservationId) {
            const addedTime = new Date(item.addedAt).getTime()
            const currentTime = Date.now()
            const timeElapsed = currentTime - addedTime

            if (timeElapsed > RESERVATION_TIMEOUT) {
              await get().releaseReservation(item.reservationId)
            }
          }
        }
      }
    }),
    {
      name: 'coffee-cart-storage',
      partialize: (state) => ({
        items: state.items.map(item => ({
          ...item,
          reservationId: undefined // Don't persist reservations
        }))
      })
    }
  )
)