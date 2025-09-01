import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { 
  useCoffeeProducts, 
  useProductsWithInventory, 
  useProductRecommendations,
  useSampleDataInitialization
} from '@/hooks/use-coffee-data'
import { useCoffeeDatabase } from '@/hooks/use-coffee-database'
import type { CoffeeProduct, ProductWithInventory } from '@/types/coffee'
import { 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  Truck, 
  Gift,
  Play,
  Pause,
  Volume2,
  Heart,
  ShoppingCart,
  CheckCircle,
  Package,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { AdminPanel } from '@/components/AdminPanel'
import { useAuthStore } from '@/store/auth-store'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CartButton } from '@/components/cart/CartButton'
import { useCartStore } from '@/store/cart-store'
import { ProductCard } from '@/components/ProductCard'
import { table } from '@devvai/devv-code-backend'
import { useNavigate } from 'react-router-dom'

// Subscription plans
const subscriptionPlans = [
  {
    id: 'discovery',
    name: "Discovery",
    price: 1890, // in cents
    intensity: 2,
    description: "Light to medium roasts for adventurous palates",
    features: ["1 variety per month", "350g bags", "Tasting notes included", "Free shipping"],
    bags_per_delivery: 1
  },
  {
    id: 'signature',
    name: "Signature",
    price: 2890, // in cents
    intensity: 5,
    description: "Our curated selection of exceptional coffees",
    features: ["2 varieties per month", "350g bags each", "Origin stories", "Priority support"],
    bags_per_delivery: 2
  },
  {
    id: 'premium',
    name: "Premium",
    price: 4490, // in cents
    intensity: 8,
    description: "Rare and exclusive micro-lot coffees",
    features: ["3 premium varieties", "Limited editions", "Personal consultation", "VIP access"],
    bags_per_delivery: 3
  }
]

function HomePage() {
  const [selectedIntensity, setSelectedIntensity] = useState(4)
  const [selectedPlan, setSelectedPlan] = useState('signature')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { refreshReservations } = useCartStore()

  // Data hooks
  const { products, loading: productsLoading, error: productsError } = useCoffeeProducts()
  const { products: productsWithInventory, loading: inventoryLoading } = useProductsWithInventory()
  const { recommendations, loading: recommendationsLoading } = useProductRecommendations(
    selectedIntensity, 
    []
  )
  const { initializeSampleData, initialized, initializing } = useSampleDataInitialization()
  const { 
    products: dbProducts, 
    loading: dbLoading, 
    getFeaturedProducts, 
    getProductsByIntensity 
  } = useCoffeeDatabase()
  
  // Auth hooks
  const { user, isAuthenticated } = useAuthStore()

  // Initialize sample data on first load
  useEffect(() => {
    if (!initialized && !initializing) {
      initializeSampleData()
    }
  }, [initialized, initializing, initializeSampleData])

  // Refresh cart reservations on page load
  useEffect(() => {
    refreshReservations()
  }, [refreshReservations])

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Loading Error",
        description: "Failed to load coffee products. Please refresh the page.",
        variant: "destructive"
      })
    }
  }, [productsError, toast])

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 2) return "Mild & Smooth"
    if (intensity <= 4) return "Balanced & Rich"
    if (intensity <= 6) return "Bold & Complex"
    if (intensity <= 8) return "Dark & Intense"
    return "Extra Bold"
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'bg-amber-100 text-amber-800'
    if (intensity <= 6) return 'bg-orange-100 text-orange-800'
    if (intensity <= 8) return 'bg-red-100 text-red-800'
    return 'bg-red-200 text-red-900'
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const handleSubscriptionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    const formData = new FormData(e.currentTarget)
    const plan = subscriptionPlans.find(p => p.id === selectedPlan)
    
    if (!plan) return

    try {
      await table.addItem('evn00i73xszk', {
        customer_email: user?.email || '',
        customer_name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        preferred_intensity: selectedIntensity,
        preferred_roast_levels: '',
        delivery_frequency: 'monthly',
        bag_quantity: plan.bags_per_delivery,
        subscription_plan: selectedPlan,
        status: 'active',
        next_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shipping_address: JSON.stringify({
          street: formData.get('address'),
          city: formData.get('city'),
          state: formData.get('state'),
          zip: formData.get('zip'),
          country: 'US'
        }),
        special_instructions: formData.get('specialInstructions') || '',
        total_deliveries: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      toast({
        title: "Subscription Created!",
        description: `Welcome to ${plan.name}! Your first delivery will arrive within 7-10 business days.`
      })

      navigate('/dashboard')
    } catch (error) {
      console.error('Subscription creation failed:', error)
      toast({
        title: "Subscription Failed",
        description: "There was an error creating your subscription. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">Artisan Coffee Co.</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 text-white/90">
              <a href="#products" className="hover:text-white transition-colors">Products</a>
              <a href="#subscriptions" className="hover:text-white transition-colors">Subscriptions</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdminPanel ? 'Hide Admin' : 'Admin'}
              </Button>
            </nav>
            
            <div className="flex items-center gap-4">
              <CartButton />
              {isAuthenticated && user ? (
                <>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-white/10"
                  >
                    Dashboard
                  </Button>
                  <UserMenu />
                </>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Panel */}
      {showAdminPanel && (
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-6">
            <AdminPanel />
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2C1810] via-[#8B4513] to-[#A0522D]">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 texture-overlay opacity-10" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              Artisan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#D2B48C] to-[#F5E6D3]">
                Coffee Co.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Where every cup tells a story of passion, craftsmanship, and the perfect roast. 
              Experience coffee the way it was meant to be.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-[#8B4513] hover:bg-white/90 font-semibold px-8 py-3"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Shop Coffee
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-[#8B4513] font-semibold px-8 py-3"
              onClick={() => document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Package className="w-5 h-5 mr-2" />
              Subscribe & Save
            </Button>
          </div>
        </div>

        {/* Coffee pour animation placeholder */}
        <div className="absolute bottom-20 right-20 hidden lg:block">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#8B4513] to-[#A0522D] opacity-20 animate-pulse" />
        </div>
      </section>

      {/* Coffee Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Our Coffee Collection
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each variety tells a unique story of origin, terroir, and craftsmanship. 
              Add exceptional beans to your cart with real-time inventory tracking.
            </p>
          </div>

          <div className="relative">
            {/* Scroll buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm"
              onClick={scrollLeft}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm"
              onClick={scrollRight}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Horizontal scroll container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto smooth-scroll pb-4 px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {productsLoading ? (
                // Loading skeletons
                [...Array(3)].map((_, index) => (
                  <Card key={index} className="flex-shrink-0 w-80">
                    <Skeleton className="aspect-square w-full rounded-t-lg" />
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-16 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : productsWithInventory.length > 0 ? (
                productsWithInventory.map((item) => (
                  <ProductCard 
                    key={item.product._id} 
                    product={item}
                    className="flex-shrink-0 w-80"
                  />
                ))
              ) : (
                <div className="flex-shrink-0 w-80 h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Coffee className="w-12 h-12 mx-auto mb-4" />
                    <p>No coffee products available</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section id="subscriptions" className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your Perfect Match
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select your preferred coffee intensity, then choose the subscription that fits your lifestyle.
            </p>
          </div>

          {/* Intensity Spectrum */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <div className="h-16 intensity-spectrum rounded-full relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 texture-overlay" />
              </div>
              
              <div className="flex justify-between items-center mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => setSelectedIntensity(intensity)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                      selectedIntensity === intensity 
                        ? 'bg-[#8B4513] text-white scale-110' 
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-sm font-bold">{intensity}</span>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </button>
                ))}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-lg font-medium text-[#8B4513]">
                  {getIntensityLabel(selectedIntensity)}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-[#8B4513] shadow-lg scale-105' 
                    : 'hover:scale-102'
                }`}
              >
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-[#8B4513] mb-2">
                      ${(plan.price / 100).toFixed(0)}
                      <span className="text-lg text-muted-foreground">/month</span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Your Subscription</h2>
            <p className="text-muted-foreground">
              Fill in your details to start receiving exceptional coffee
            </p>
          </div>

          <form onSubmit={handleSubscriptionSubmit} className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    className="w-full px-4 py-3 border rounded-lg bg-background"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    className="w-full px-4 py-3 border rounded-lg bg-background"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  name="address"
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-lg bg-background"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    name="city"
                    type="text"
                    required
                    className="w-full px-4 py-3 border rounded-lg bg-background"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    name="state"
                    type="text"
                    required
                    className="w-full px-4 py-3 border rounded-lg bg-background"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ZIP</label>
                  <input
                    name="zip"
                    type="text"
                    required
                    className="w-full px-4 py-3 border rounded-lg bg-background"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions</label>
                <textarea
                  name="specialInstructions"
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg bg-background"
                  placeholder="Any delivery preferences or dietary restrictions..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Selected Plan:</span>
                    <span className="font-medium">
                      {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Intensity Preference:</span>
                    <span className="font-medium">{selectedIntensity}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Price:</span>
                    <span className="font-medium">
                      ${((subscriptionPlans.find(p => p.id === selectedPlan)?.price || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      ${((subscriptionPlans.find(p => p.id === selectedPlan)?.price || 0) / 100).toFixed(2)}/month
                    </span>
                  </div>
                </div>
              </Card>

              <Button type="submit" className="w-full h-12 text-lg">
                {isAuthenticated ? 'Start Subscription' : 'Sign In to Subscribe'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Free shipping • Cancel anytime • 30-day guarantee</p>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Shopping Cart */}
      <CartDrawer />
    </div>
  )
}

export default HomePage