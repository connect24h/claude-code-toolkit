# Coding Standards - Detailed Code Examples

## Variable Naming

```typescript
// GOOD: Descriptive names
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// BAD: Unclear names
const q = 'election'
const flag = true
const x = 1000
```

## Function Naming

```typescript
// GOOD: Verb-noun pattern
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// BAD: Unclear or noun-only
async function market(id: string) { }
function similarity(a, b) { }
function email(e) { }
```

## Immutability Pattern (CRITICAL)

```typescript
// ALWAYS use spread operator
const updatedUser = { ...user, name: 'New Name' }
const updatedArray = [...items, newItem]

// NEVER mutate directly
user.name = 'New Name'  // BAD
items.push(newItem)     // BAD
```

## Error Handling

```typescript
// GOOD: Comprehensive error handling
async function fetchData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}

// BAD: No error handling
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}
```

## Async/Await Best Practices

```typescript
// GOOD: Parallel execution when possible
const [users, markets, stats] = await Promise.all([
  fetchUsers(), fetchMarkets(), fetchStats()
])

// BAD: Sequential when unnecessary
const users = await fetchUsers()
const markets = await fetchMarkets()
const stats = await fetchStats()
```

## Type Safety

```typescript
// GOOD: Proper types
interface Market {
  id: string
  name: string
  status: 'active' | 'resolved' | 'closed'
  created_at: Date
}

function getMarket(id: string): Promise<Market> { }

// BAD: Using 'any'
function getMarket(id: any): Promise<any> { }
```

## React Component Structure

```typescript
// GOOD: Functional component with types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children, onClick, disabled = false, variant = 'primary'
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>
      {children}
    </button>
  )
}

// BAD: No types, unclear structure
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

## Custom Hooks

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

## State Management

```typescript
// GOOD: Functional update for state based on previous state
setCount(prev => prev + 1)

// BAD: Direct state reference (can be stale in async)
setCount(count + 1)
```

## Conditional Rendering

```typescript
// GOOD: Clear conditional rendering
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// BAD: Ternary hell
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; page: number; limit: number }
}

// Success
return NextResponse.json({ success: true, data: markets, meta: { total: 100, page: 1, limit: 10 } })

// Error
return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
```

## Input Validation

```typescript
import { z } from 'zod'

const CreateMarketSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  endDate: z.string().datetime(),
  categories: z.array(z.string()).min(1)
})

export async function POST(request: Request) {
  const body = await request.json()
  try {
    const validated = CreateMarketSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false, error: 'Validation failed', details: error.errors
      }, { status: 400 })
    }
  }
}
```

## Memoization

```typescript
import { useMemo, useCallback } from 'react'

const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

## Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

## Database Queries

```typescript
// GOOD: Select only needed columns
const { data } = await supabase.from('markets').select('id, name, status').limit(10)

// BAD: Select everything
const { data } = await supabase.from('markets').select('*')
```

## Test Structure (AAA Pattern)

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

## Code Smell Detection

### Long Functions
```typescript
// BAD: Function > 50 lines
// GOOD: Split into smaller functions
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### Deep Nesting
```typescript
// BAD: 5+ levels of nesting
// GOOD: Early returns
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
// Do something
```

### Magic Numbers
```typescript
// BAD
if (retryCount > 3) { }

// GOOD
const MAX_RETRIES = 3
if (retryCount > MAX_RETRIES) { }
```

## Comments

```typescript
// GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during outages
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// BAD: Stating the obvious
// Increment counter by 1
count++
```

## JSDoc for Public APIs

```typescript
/**
 * Searches markets using semantic similarity.
 *
 * @param query - Natural language search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of markets sorted by similarity score
 * @throws {Error} If OpenAI API fails or Redis unavailable
 */
export async function searchMarkets(query: string, limit: number = 10): Promise<Market[]> {
  // Implementation
}
```
