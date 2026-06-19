import Link from 'next/link'
import { Flame, HardHat, Mountain, Wheat, Truck } from 'lucide-react'

const CATEGORIES = [
  {
    label: 'Oil & Gas',
    icon: Flame,
    href: '/search?industry=oil_gas',
    description: 'Rigs, pipe, BOP, wellheads',
  },
  {
    label: 'Construction',
    icon: HardHat,
    href: '/search?industry=construction',
    description: 'Excavators, cranes, loaders',
  },
  {
    label: 'Mining',
    icon: Mountain,
    href: '/search?industry=mining',
    description: 'Haul trucks, drilling, processing',
  },
  {
    label: 'Agriculture',
    icon: Wheat,
    href: '/search?industry=agriculture',
    description: 'Tractors, combines, irrigation',
  },
  {
    label: 'Trucks & Trailers',
    icon: Truck,
    href: '/search?industry=trucks_trailers',
    description: 'Flatbeds, tankers, vocational',
  },
]

export default function CategoryBrowse() {
  return (
    <section className="py-10 border-t border-[#E8E9EA]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2
            className="font-sans font-bold text-2xl text-ink"
            style={{ letterSpacing: '-0.02em' }}
          >
            Browse by Industry
          </h2>
          <p className="mt-1 text-sm font-sans text-ink-3">Find equipment by industry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="group bg-white border border-[#E8E9EA] hover:border-orange rounded-[16px] p-5 flex flex-col items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover no-underline"
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors duration-200"
                style={{ background: '#FFF2ED' }}
              >
                <Icon className="w-5 h-5 text-orange" strokeWidth={1.5} />
              </div>
              <div>
                <p
                  className="font-sans font-semibold text-ink group-hover:text-orange transition-colors duration-200"
                  style={{ fontSize: '14px' }}
                >
                  {cat.label}
                </p>
                <p className="font-sans text-ink-3 mt-0.5" style={{ fontSize: '12px' }}>
                  {cat.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
