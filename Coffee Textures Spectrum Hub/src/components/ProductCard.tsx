import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import type { ProductWithInventory } from '@/types/coffee'
import { 
  Star, 
  MapPin, 
  ShoppingCart, 
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ProductCardProps {
  product: ProductWithInventory
  className?: string
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const { addItem, getItemCount, updateQuantity } = useCartStore()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  
  const cartQuantity = getItemCount(product.product._id)
  const availableStock = product.available_stock
  const isOutOfStock = availableStock <= 0
  const isLowStock = availableStock > 0 && availableStock <= 5

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'bg-amber-100 text-amber-800'
    if (intensity <= 6) return 'bg-orange-100 text-orange-800'
    if (intensity <= 8) return 'bg-red-100 text-red-800'
    return 'bg-red-200 text-red-900'
  }

  const getRoastDisplayName = (roast: string) => {
    return roast.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    setIsAdding(true)
    
    try {
      const success = await addItem(product, 1)
      
      if (success) {
        toast({
          title: "Added to Cart",
          description: `${product.product.name} has been added to your cart.`
        })
      } else {
        toast({
          title: "Cannot Add to Cart",
          description: "Insufficient inventory or failed to reserve stock.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) return
    
    const success = await updateQuantity(product.product._id, newQuantity)
    
    if (!success) {
      toast({
        title: "Cannot Update Quantity",
        description: "Insufficient inventory available.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${isOutOfStock ? 'opacity-60' : ''} ${className}`}>
      <div className="aspect-square overflow-hidden bg-muted relative">
        <img
          src={product.product.image_url}
          alt={product.product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `https://images.unsplash.com/photo-1587080149223-0d4e8f6e6e3a?w=400&h=400&fit=crop&crop=center`
          }}
        />
        
        {/* Stock status overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Stock
            </Badge>
          )}
          {!isOutOfStock && !isLowStock && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              In Stock
            </Badge>
          )}
        </div>

        {/* Intensity badge */}
        <div className="absolute top-2 right-2">
          <Badge className={getIntensityColor(product.product.intensity)}>
            {product.product.intensity}/10
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product info */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-[#8B4513] transition-colors">
              {product.product.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>{product.product.origin}</span>
              <span>•</span>
              <span>{getRoastDisplayName(product.product.roast_level)}</span>
            </div>
          </div>

          {/* Flavor profile */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Flavor Notes:</p>
            <div className="flex flex-wrap gap-1">
              {product.product.flavor_profile.split(',').slice(0, 3).map((flavor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {flavor.trim()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stock info */}
          <div className="text-xs text-muted-foreground">
            {availableStock > 0 ? (
              <span>{availableStock} available</span>
            ) : (
              <span>Out of stock</span>
            )}
          </div>

          {/* Price and actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-[#8B4513]">
                {formatPrice(product.product.price)}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>4.8</span>
                <span>•</span>
                <span>{product.inventory?.total_sold || 0} sold</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {cartQuantity > 0 ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(cartQuantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {cartQuantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(cartQuantity + 1)}
                    disabled={cartQuantity >= availableStock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className="bg-[#8B4513] hover:bg-[#A0522D] text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}