'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Search, Filter, Loader2, ShoppingCart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';

export default function TestList() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 1000],
    difficulty: [],
    ratings: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tests from API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tests/marketplace');
        const data = await response.json();
        if (response.ok) {
          setTests(data.tests);
          setFilteredTests(data.tests);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...tests];

    // Apply search
    if (searchQuery) {
      result = result.filter(test =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filters
    if (filters.categories.length > 0) {
      result = result.filter(test =>
        filters.categories.some(cat => test.categories.includes(cat))
      );
    }

    // Apply difficulty filter
    if (filters.difficulty.length > 0) {
      result = result.filter(test =>
        filters.difficulty.includes(test.difficulty)
      );
    }

    // Apply price range filter
    result = result.filter(test =>
      test.price >= filters.priceRange[0] && test.price <= filters.priceRange[1]
    );

    // Apply rating filter
    if (filters.ratings > 0) {
      result = result.filter(test => test.averageRating >= filters.ratings);
    }

    setFilteredTests(result);
  }, [searchQuery, filters, tests]);

  const handleCategoryChange = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDifficultyChange = (difficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulty: prev.difficulty.includes(difficulty)
        ? prev.difficulty.filter(d => d !== difficulty)
        : [...prev.difficulty, difficulty]
    }));
  };

  const handlePriceChange = (value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({
      ...prev,
      ratings: prev.ratings === rating ? 0 : rating
    }));
  };

  const categories = [...new Set(tests.flatMap(test => test.categories))];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Marketplace</h1>
          <p className="text-muted-foreground">Browse and purchase practice tests</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tests..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div className="w-full md:w-64 space-y-6">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-6`}>
            {/* Categories */}
            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cat-${category}`} 
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <Label htmlFor={`cat-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={handlePriceChange}
                  min={0}
                  max={1000}
                  step={10}
                  minStepsBetweenThumbs={1}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{filters.priceRange[0]}</span>
                  <span>₹{filters.priceRange[1]}+</span>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h3 className="font-medium mb-3">Difficulty</h3>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`diff-${difficulty}`}
                      checked={filters.difficulty.includes(difficulty)}
                      onCheckedChange={() => handleDifficultyChange(difficulty)}
                    />
                    <Label htmlFor={`diff-${difficulty}`} className="text-sm">
                      {difficulty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Ratings */}
            <div>
              <h3 className="font-medium mb-3">Minimum Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <div 
                    key={rating} 
                    className={`flex items-center p-2 rounded-md cursor-pointer ${filters.ratings === rating ? 'bg-accent' : 'hover:bg-muted/50'}`}
                    onClick={() => handleRatingChange(rating)}
                  >
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      & Up
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setFilters({
                categories: [],
                priceRange: [0, 1000],
                difficulty: [],
                ratings: 0,
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Test Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">
              {filteredTests.length} {filteredTests.length === 1 ? 'Test' : 'Tests'} Found
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select className="bg-background border rounded-md px-3 py-1.5 text-sm">
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium">No tests found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    categories: [],
                    priceRange: [0, 1000],
                    difficulty: [],
                    ratings: 0,
                  });
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => (
                <TestCard key={test.id} test={test} onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestCard({ test, onAddToCart }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await onAddToCart(test);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={test.image || '/placeholder-test.jpg'}
          alt={test.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {test.difficulty}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{test.title}</CardTitle>
          <div className="text-lg font-bold text-primary">
            {test.price === 0 ? 'Free' : `₹${test.price}`}
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {test.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <div className="flex items-center mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(test.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-1">
            ({test.reviewCount} reviews)
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {test.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {test.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{test.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
