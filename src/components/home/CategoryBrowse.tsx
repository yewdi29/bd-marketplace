import Link from 'next/link'
import { Flame, HardHat, Mountain, Trees, Truck, Wheat } from 'lucide-react'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'

const INDUSTRIES = [
  {
    label: 'Oil & Gas',
    icon: Flame,
    href: '/search?industry=oil_gas',
    description: 'Drilling rigs, pumps & wellhead equipment',
  },
  {
    label: 'Construction',
    icon: HardHat,
    href: '/search?industry=construction',
    description: 'Excavators, dozers, cranes & loaders',
  },
  {
    label: 'Mining',
    icon: Mountain,
    href: '/search?industry=mining',
    description: 'Haul trucks, drills, crushers & conveyors',
  },
  {
    label: 'Agriculture',
    icon: Wheat,
    href: '/search?industry=agriculture',
    description: 'Tractors, combines & irrigation systems',
  },
  {
    label: 'Trucks & Trailers',
    icon: Truck,
    href: '/search?industry=trucks_trailers',
    description: 'Heavy haul, flatbeds & specialty units',
  },
  {
    label: 'Forestry',
    icon: Trees,
    href: '/search?industry=forestry',
    description: 'Harvesters, skidders, loaders & mill equipment',
  },
]

export default function CategoryBrowse() {
  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]">
      <HomeSectionHeader linkHref="/search" linkLabel="Browse all →">
        <h2
          className="font-sans font-bold text-ink"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Browse by Industry
        </h2>
        <p className="mt-4 font-sans text-ink-3 text-base leading-relaxed">
          Find equipment by industry
        </p>
      </HomeSectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map(industry => {
          const Icon = industry.icon
          return (
            <Link
              key={industry.label}
              href={industry.href}
              className="group flex items-center bg-white border border-[#E8E9EA] hover:border-orange rounded-[16px] transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover no-underline"
              style={{ minHeight: '94px', paddingLeft: '22px', paddingRight: '22px', gap: '17px' }}
            >
              <div
                className="shrink-0 rounded-lg flex items-center justify-center transition-colors duration-200"
                style={{ width: '55px', height: '55px', background: '#FFF2ED' }}
              >
                <Icon className="text-orange" style={{ width: '28px', height: '28px' }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-sans font-bold text-ink group-hover:text-orange transition-colors duration-200 truncate"
                  style={{ fontSize: '14px', lineHeight: 1.3 }}
                >
                  {industry.label}
                </p>
                <p
                  className="font-sans text-ink-3 truncate"
                  style={{ fontSize: '12px', lineHeight: 1.35 }}
                >
                  {industry.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
