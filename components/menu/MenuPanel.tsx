import { forwardRef } from 'react'
import { BASE_PRICES, isFoodItem } from '@/lib/menu'

// ---------------------------------------------------------------------------
// Menu display data — categories + items with display notes
// ---------------------------------------------------------------------------

interface MenuItem {
  name: string
  notes?: string
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

const MENU_CATEGORIES: MenuCategory[] = [
  {
    name: 'Coffee',
    items: [
      { name: 'Americano', notes: 'Hot or Iced' },
      { name: 'Latte', notes: 'Hot or Iced' },
      { name: 'Cold Brew', notes: 'Iced only' },
      { name: 'Mocha', notes: 'Hot or Iced' },
      { name: 'Coffee Frappuccino', notes: 'Iced only' },
    ],
  },
  {
    name: 'Tea',
    items: [
      { name: 'Black Tea', notes: 'Hot or Iced' },
      { name: 'Jasmine Tea', notes: 'Hot or Iced' },
      { name: 'Lemon Green Tea', notes: 'Hot or Iced' },
      { name: 'Matcha Latte', notes: 'Hot or Iced' },
    ],
  },
  {
    name: 'Pastry',
    items: [
      { name: 'Plain Croissant' },
      { name: 'Chocolate Croissant' },
      { name: 'Chocolate Chip Cookie' },
      { name: 'Banana Bread' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(name: string): string {
  const key = name.trim().toLowerCase()
  const prices = BASE_PRICES[key]
  if (!prices) return ''
  if (isFoodItem(name)) {
    return `$${prices.small.toFixed(2)}`
  }
  return `$${prices.small.toFixed(2)} / $${prices.large.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MenuPanel = forwardRef<HTMLDivElement>(function MenuPanel(_props, ref) {
  return (
    <div
      ref={ref}
      className="rounded-xl border border-cafe-charcoal/10 bg-white p-4"
    >
      <h2 className="mb-4 font-serif text-xl text-cafe-coffee">Menu</h2>

      <div className="space-y-5">
        {MENU_CATEGORIES.map((category) => {
          const showSizeLabel = category.name === 'Coffee'
          return (
            <div key={category.name}>
              <h3 className="mb-2 flex items-baseline justify-between font-serif text-base text-cafe-charcoal/80">
                <span>{category.name}</span>
                {showSizeLabel && (
                  <span className="text-xs font-sans font-normal text-cafe-charcoal/40">
                    sm (12oz) / lg (16oz)
                  </span>
                )}
              </h3>
              <ul className="space-y-1.5">
                {category.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-cafe-charcoal">
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="ml-1.5 text-xs text-cafe-charcoal/50">
                          {item.notes}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-cafe-charcoal/70">
                      {formatPrice(item.name)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        {/* Add-ons section */}
        <div>
          <h3 className="mb-2 font-serif text-base text-cafe-charcoal/80">
            Add-ons &amp; Extras
          </h3>
          <ul className="space-y-1.5">
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Whole / Skim Milk</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">Free</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Oat Milk</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">+$0.50</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Almond Milk</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">+$0.75</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Extra Espresso / Matcha Shot</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">+$1.50</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Caramel / Hazelnut Syrup</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">+$0.50 per pump</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Sweetness</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">No &middot; Less &middot; Extra</span>
            </li>
            <li className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-cafe-charcoal">Ice</span>
              <span className="shrink-0 text-sm text-cafe-charcoal/70">No &middot; Less &middot; Extra</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
})

export default MenuPanel
