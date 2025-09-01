import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2,
  Clock,
  CreditCard
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { table } from '@devvai/devv-code-backend'

export function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getTotalPrice 
  } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    const success = await updateQuantity(productId, newQuantity)
    if (!success) {
      toast({
        title: "Insufficient Stock",
        description: "Not enough inventory available for this quantity.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveItem = async (productId: string) => {
    await removeItem(productId)
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart."
    })
  }

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to proceed with checkout.",
        variant: "destructive"
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add some coffee to your cart first!",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create order
      const orderNumber = `AC${Date.now().toString().slice(-8)}`
      const subtotal = getTotalPrice()
      const shippingCost = subtotal > 5000 ? 0 : 500 // Free shipping over $50
      const taxAmount = Math.round(subtotal * 0.08) // 8% tax
      const totalAmount = subtotal + shippingCost + taxAmount

      const orderItems = items.map(item => ({
        product_id: item.product.product._id,
        name: item.product.product.name,
        quantity: item.quantity,
        price: item.product.product.price,
        total: item.product.product.price * item.quantity
      }))

      await table.addItem('evn0gqq0jvuo', {
        order_number: orderNumber,
        customer_email: user?.email || '',
        order_type: 'one_time',
        order_status: 'pending',
        order_items: JSON.stringify(orderItems),
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'pending',
        order_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Update inventory - convert reservations to actual sales
      for (const item of items) {
        const inventoryResponse = await table.getItems('evn000r9yk8w', {
          query: { product_id: item.product.product._id },
          limit: 1
        })

        if (inventoryResponse.items.length > 0) {
          const inventory = inventoryResponse.items[0]
          await table.updateItem('evn000r9yk8w', {
            _uid: inventory._uid,
            _id: inventory._id,
            current_stock: inventory.current_stock - item.quantity,
            reserved_stock: Math.max(0, inventory.reserved_stock - item.quantity),
            total_sold: inventory.total_sold + item.quantity,
            updated_at: new Date().toISOString()
          })
        }
      }

      await clearCart()
      closeCart()

      toast({
        title: "Order Placed Successfully!",
        description: `Order ${orderNumber} has been created. You'll receive a confirmation email shortly.`
      })

      navigate('/dashboard')
    } catch (error) {
      console.error('Checkout failed:', error)
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Cart</h2>
              {items.length > 0 && (
                <Badge variant="secondary">
                  {items.reduce((total, item) => total + item.quantity, 0)}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={closeCart}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Add some delicious coffee to get started!
                </p>
                <Button onClick={closeCart}>Continue Shopping</Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.product.product._id} className="group">
                    <div className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                      <div className="h-16 w-16 rounded-md bg-muted overflow-hidden">
                        <img
                          src={item.product.product.image_url}
                          alt={item.product.product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `https://images.unsplash.com/photo-1587080149223-0d4e8f6e6e3a?w=100&h=100&fit=crop&crop=center`
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.product.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.product.product.origin} • {item.product.product.roast_level.replace('_', ' ')}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleQuantityChange(item.product.product._id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleQuantityChange(item.product.product._id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {formatPrice(item.product.product.price * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveItem(item.product.product._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {item.reservationId && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 px-3">
                        <Clock className="h-3 w-3" />
                        <span>Reserved for 15 minutes</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{getTotalPrice() > 5000 ? 'Free' : '$5.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(Math.round(getTotalPrice() * 0.08))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      getTotalPrice() + 
                      (getTotalPrice() > 5000 ? 0 : 500) + 
                      Math.round(getTotalPrice() * 0.08)
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Checkout'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Items are reserved for 15 minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}