import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sun, Moon, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useUsers } from '@/hooks/useUsers'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { searchUsers } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Search users with debouncing
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([])
        setShowResults(false)
        return
      }

      setSearching(true)
      try {
        const results = await searchUsers(searchTerm)
        setSearchResults(results.slice(0, 8)) // Limit to 8 results
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(searchUsersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchUsers])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUserClick = () => {
    setShowResults(false)
    setSearchTerm('')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger />
        
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              onFocus={() => searchTerm && setShowResults(true)}
            />
            
            {/* Search Results Dropdown */}
            {showResults && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
                <CardContent className="p-2">
                  {searching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <Link
                          key={user.id}
                          to={`/users/${user.id}`}
                          onClick={handleUserClick}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          </div>
                          <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No users found for "{searchTerm}"
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}