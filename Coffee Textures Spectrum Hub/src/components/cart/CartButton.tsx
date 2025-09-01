import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { ShoppingCart } from 'lucide-react'

export function CartButton() {
  const { getTotalItems, openCart } = useCartStore()
  const itemCount = getTotalItems()

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative"
      onClick={openCart}
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  )
}