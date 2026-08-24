'use client'

import { useEffect, useState } from 'react'
import {
  ArrowUpRight, CalendarDays, Camera, Check, ChevronDown, Clock, Flame, Footprints,
  Globe, Heart, Mail, MapPin, Menu, Phone, Play, Salad, ShieldCheck, Sparkles, Sun, Trophy, Users, X,
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Events', href: '#events' },
  { label: 'Contact', href: '#contact' },
]

const committee = [
  { name: 'Anil Choudhury', role: 'President', initials: 'AC' },
  { name: 'Mita Sharma', role: 'Secretary', initials: 'MS' },
  { name: 'Rajiv Das', role: 'Treasurer', initials: 'RD' },
  { name: 'Kavita Roy', role: 'Cultural Coordinator', initials: 'KR' },
]

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={`reveal ${className}`} style={{ '--delay': `${delay}ms` } as React.CSSProperties}>{children}</div>
}

function SectionHeading({ kicker, title, copy, className = '' }: { kicker: string; title: string; copy?: string; className?: string }) {
  return (
    <div className={`section-heading max-w-2xl ${className}`}>
      <span className="block mb-4 text-[10px] font-bold tracking-[0.17em] uppercase text-[var(--saffron)]">{kicker}</span>
      <h2 className="text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[0.98]">{title}</h2>
      {copy && <p className="mt-5 text-[var(--muted-foreground)] text-[15px]">{copy}</p>}
    </div>
  )
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('js-ready')

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )
    const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)), { rootMargin: '-35% 0px -55% 0px' })
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))
    document.querySelectorAll('main section[id]').forEach((el) => sectionObserver.observe(el))

    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => { revealObserver.disconnect(); sectionObserver.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <main>
      {/* Header */}
      <header className={`sticky top-0 z-25 bg-gradient-to-b from-[var(--maroon)] to-[#6b1917] text-[#fffaf3] border-b-[3px] border-[var(--gold)] transition-all duration-300 ${scrolled ? 'py-2 shadow-2xl' : 'py-4'}`}>
        <div className="container mx-auto px-6 max-w-[1180px] flex items-center justify-between">
          <a className="flex items-center gap-3 group" href="#home" onClick={closeMenu}>
            <span className="grid place-items-center w-10 h-10 border-[1.5px] border-[var(--gold)] rounded-full text-[var(--gold)] text-xl bg-[#e9b94f]/10 font-serif group-hover:bg-[#e9b94f]/20 transition-colors">ॐ</span>
            <span className="flex flex-col leading-tight">
              <strong className="text-[var(--gold)] font-serif text-lg tracking-tight">Rilbong Sanatan Hindu Dharma Sabha</strong>
              <small className="text-[8px] uppercase tracking-widest text-[#fffaf3]/70">Community Welfare & Tradition</small>
            </span>
          </a>
          
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>

          <nav className={`${menuOpen ? 'flex absolute top-full left-0 right-0 flex-col bg-[#2b1813] border-t border-white/10' : 'hidden'} md:flex items-center gap-7 text-xs tracking-wide`}>
            {navItems.map((item) => (
              <a key={item.href} className={`block px-6 py-4 md:p-0 hover:text-[var(--gold)] transition-colors ${active === item.href.slice(1) ? 'text-[var(--gold)]' : 'text-white/80'}`} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <a className="m-4 md:m-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--gold)] text-[var(--ink)] font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all" href="#events" onClick={closeMenu}>
              Join an event <ArrowUpRight size={15} />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-b from-[#4a1210] via-[#7a1c1c] to-[#341410] text-[#fffaf3] overflow-hidden px-6 py-24" id="home">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(230,177,63,0.12)_0%,_transparent_70%)] pointer-events-none" />
        
        <div className="container mx-auto max-w-[1180px] z-10 relative flex flex-col items-center text-center">
          {/* <Reveal>
            <div className="w-16 h-16 border-2 border-[var(--gold)] rounded-full flex items-center justify-center text-[var(--gold)] font-serif text-3xl mb-8 shadow-xl bg-[var(--gold)]/5">
              ॐ
            </div>
          </Reveal> */}
          
          <Reveal delay={80}>
            <p className="text-[var(--gold)] text-xs font-bold tracking-[0.3em] uppercase mb-4">Rilbong, Shillong • Established 1927</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.1] max-w-4xl">
              Rilbong Sanatan Hindu<br /><em className="text-[var(--gold)] italic">Dharma Sabha</em>
            </h1>
          </Reveal>
          
          <Reveal delay={160}>
            <p className="mt-6 text-[#fffaf3]/90 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Nurturing cultural heritage, community service, and the timeless values of unity and compassion in Rilbong.
            </p>
          </Reveal>
          
          <Reveal delay={240}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[var(--gold)] to-[var(--marigold)] text-[var(--ink)] font-bold text-sm rounded-full hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(230,177,63,0.3)] transition-all" href="#events">
                Explore our events <ArrowUpRight size={17} />
              </a>
              <a className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--gold)]/60 text-white font-bold text-sm rounded-full hover:bg-[var(--gold)]/15 backdrop-blur-sm transition-all" href="#about">
                Discover our story
              </a>
            </div>
          </Reveal>
          
          <Reveal delay={300} className="w-full mt-24 pt-10 border-t border-white/20 max-w-3xl">
            <div className="flex flex-wrap justify-center gap-12 md:gap-24">
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal">40+</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Years of service</span>
              </div>
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal">1000+</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Community members</span>
              </div>
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal">2</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Major events this season</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <div className="festival-marquee relative z-10 overflow-hidden border-b border-[#321714]/20 bg-[var(--maroon)] text-[var(--cream)]">
        <div className="flex items-center justify-around gap-8 w-max min-w-full py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap"><Sparkles size={11} /> RILBONG COMMUNITY FESTIVAL</span><i className="text-[var(--gold)] text-xs not-italic">✦</i>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap">3 OCT / FOOD FESTIVAL</span><i className="text-[var(--gold)] text-xs not-italic">✦</i>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap">2 OCT / MARATHON</span><i className="text-[var(--gold)] text-xs not-italic">✦</i>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap">CULTURE · WELFARE · COMMUNITY</span><i className="text-[var(--gold)] text-xs not-italic">✦</i>
        </div>
      </div>

      {/* About Us Section */}
      <section className="py-32 space-y-32" id="about">
        
        {/* Part 1: Intro */}
        <div className="container mx-auto px-6 max-w-[1180px] grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-3 flex items-center gap-3 text-[var(--muted-foreground)] text-[10px] tracking-widest uppercase">
            <span className="text-[var(--saffron)] font-serif text-2xl">01</span><span>Our organization</span>
          </div>
          <div className="lg:col-span-9 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight leading-[0.98]">Rooted in Rilbong.<br /><span className="text-[var(--maroon)] italic">Open to all.</span></h2>
            </div>
            <div className="space-y-6">
              <p className="text-[var(--muted-foreground)] text-[15px] leading-relaxed">Rilbong Sanatan Hindu Dharma Sabha is a not-for-profit organization built by neighbours, for neighbours. We gather to celebrate our shared heritage, foster unity in Rilbong, Shillong, and extend a helping hand to anyone in need through continuous charitable work.</p>
              
              <div className="flex gap-8 pt-6 border-t border-[var(--border)]">
                <div className="flex flex-col"><strong className="text-[var(--maroon)] font-serif text-3xl">10+</strong><span className="text-[var(--muted-foreground)] text-[11px] mt-1">Welfare drives / year</span></div>
                <div className="flex flex-col"><strong className="text-[var(--maroon)] font-serif text-3xl">12</strong><span className="text-[var(--muted-foreground)] text-[11px] mt-1">Cultural events / year</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Part 2: The Story (Responsive Overlapping Cards) */}
        <div className="container mx-auto px-6 max-w-[1180px] grid md:grid-cols-2 gap-16 items-center">
          
          <Reveal className="relative grid place-items-center min-h-[500px] w-full">
            <div className="relative w-full max-w-[460px] h-[460px] md:h-[480px]">
              
              {/* Top Left Card - Maroon */}
              <div className="w-full md:absolute md:top-0 md:left-0 md:w-[280px] p-8 bg-[var(--maroon)] text-[#fffaf3] rounded-3xl shadow-xl z-20 mb-6 md:mb-0 hover:-translate-y-2 transition-transform duration-500">
                <div className="w-12 h-12 bg-[#fffaf3]/10 rounded-full flex items-center justify-center mb-5">
                  <Users size={24} />
                </div>
                <h4 className="font-serif text-3xl mb-3 tracking-tight">Unity</h4>
                <p className="text-[#fffaf3]/80 text-sm leading-relaxed">Connecting the Rilbong and Shillong community across all ages and walks of life.</p>
              </div>
              
              {/* Bottom Right Card - Gold */}
              <div className="w-full md:absolute md:bottom-0 md:right-0 md:w-[280px] p-8 bg-[var(--gold)] text-[var(--ink)] rounded-3xl shadow-2xl z-30 hover:-translate-y-2 transition-transform duration-500">
                <div className="w-12 h-12 bg-[var(--ink)]/10 rounded-full flex items-center justify-center mb-5">
                  <Heart size={24} />
                </div>
                <h4 className="font-serif text-3xl mb-3 tracking-tight">Service</h4>
                <p className="text-[var(--ink)]/80 text-sm leading-relaxed">Extending a helping hand through dedicated charitable drives and welfare.</p>
              </div>

              <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-dashed border-[var(--gold)]/50 rounded-full z-10 pointer-events-none" />
            </div>
          </Reveal>

          <Reveal delay={100} className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight leading-[0.98]">A tradition of care.</h2>
            <p className="text-[var(--muted-foreground)] text-[15px] max-w-md leading-relaxed">What began as a small gathering of local families in Rilbong has grown into a shared space for generations. Our Sabha was founded by members who believed that community service, cultural preservation, and neighborhood unity are most meaningful when experienced together.</p>
            <div className="grid gap-4 mt-8 pt-8 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Fostering community welfare and unity</div>
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Supporting our neighbours in need</div>
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Keeping culture alive for the next generation</div>
            </div>
          </Reveal>
        </div>

      </section>

      {/* Events Section */}
      <section className="py-32 bg-[#f1e4cf]" id="events">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <Reveal><SectionHeading kicker="02 / Upcoming Gatherings" title="Moments worth sharing" copy="Come as you are. Leave with a full heart — and perhaps a full plate." /></Reveal>
          
          <div className="mt-16 space-y-12">
            
            {/* Event 1: Food Festival */}
            {/* Event 1: Food Festival */}
            <Reveal delay={100}>
              <article className="grid md:grid-cols-12 overflow-hidden bg-[var(--card)] border border-[#7a1c1c]/15 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
                <div className="md:col-span-5 relative grid place-items-center min-h-[350px] overflow-hidden bg-gradient-to-br from-[var(--maroon)] to-[#a3312c] bg-pattern-dots">
                  <span className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0_rgb(50_23_20/28%)]">Taste & Tradition</span>
                  <Salad className="relative z-10 w-28 h-28 text-[#fffaf3] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" />
                </div>
                <div className="md:col-span-7 p-8 md:p-14 flex flex-col justify-center">
                  <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.13em] uppercase">3 October 2026</span>
                  <h3 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight leading-[0.95]">Rilbong Community<br />Food Festival 2026</h3>
                  <p className="mt-4 text-[var(--muted-foreground)] text-base max-w-md">Celebrate the abundance of home cooking talent in our community. A joyful table of beloved recipes, shared stories, and neighbours coming together in Rilbong.</p>
                  
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[var(--border)] text-[var(--muted-foreground)] text-xs">
                    <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--maroon)]" /> 3rd Oct, 9:00 AM - 4:00 PM</span>
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--maroon)]" /> Rilbong Maidan, Shillong</span>
                    <span className="flex items-center gap-2"><Trophy size={16} className="text-[var(--maroon)]" /> Entry Fee: ₹500</span>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <a 
                      href="/register/foodfest-rilbong" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--maroon)] text-[#fffaf3] font-bold text-sm rounded-full hover:bg-[var(--deep-maroon)] hover:-translate-y-0.5 transition-all"
                    >
                      Register Now <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* Event 2: Marathon */}
            <Reveal delay={200}>
              <article className="grid md:grid-cols-12 overflow-hidden bg-[var(--card)] border border-[#7a1c1c]/15 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
                <div className="md:col-span-5 relative grid place-items-center min-h-[350px] overflow-hidden bg-gradient-to-br from-[var(--marigold)] to-[var(--gold)] bg-pattern-dots md:order-last">
                  <span className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-[var(--maroon)] text-[#fffaf3] text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0_rgb(50_23_20/28%)]">Run for Good</span>
                  <Footprints className="relative z-10 w-28 h-28 text-[var(--ink)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
                </div>
                <div className="md:col-span-7 p-8 md:p-14 flex flex-col justify-center">
                  <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.13em] uppercase">2 October 2026</span>
                  <h3 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight leading-[0.95]">Rilbong Centennial<br />Marathon</h3>
                  <p className="mt-4 text-[var(--muted-foreground)] text-base max-w-md">Every stride is a promise to do more. Join our community run supporting local welfare initiatives, open to everyone in Shillong.</p>
                  
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[var(--border)] text-[var(--muted-foreground)] text-xs">
                    <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--maroon)]" /> 2nd Oct, 5:15 AM Report • 6:00 AM Flag Off</span>
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--maroon)]" /> Rhino Museum Point → Rilbong Puja Mandap</span>
                    <span className="flex items-center gap-2"><Trophy size={16} className="text-[var(--maroon)]" /> Entry Fee: ₹300</span>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <a 
                      href="/register/marathon" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--gold)] text-[var(--ink)] font-bold text-sm rounded-full hover:bg-[var(--marigold)] hover:-translate-y-0.5 transition-all"
                    >
                      Register Now <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 bg-[var(--cream)]" id="contact">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            <Reveal>
              <SectionHeading 
                kicker="03 / Say Hello" 
                title="Our door is always open." 
                copy="Whether you have a question about our upcoming events, wish to contribute to our charitable initiatives, or simply want to say hello, we would be honored to hear from you." 
              />
            </Reveal>
            
            <Reveal delay={100}>
              <div className="bg-[var(--card)] border border-[var(--gold)]/30 rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-10">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Visit Us</span>
                      <address className="not-italic font-serif text-xl text-[var(--ink)] leading-snug">
                        Rilbong Maidan, Shillong, Meghalaya - 793004
                      </address>
                    </div>
                  </div>
                  
                  <div className="flex gap-5 items-center">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <Phone size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Call Us</span>
                      <a href="tel:+919436103190" className="font-serif text-xl text-[var(--ink)] hover:text-[var(--maroon)] transition-colors">+91 94361 03190</a>
                    </div>
                  </div>

                  <div className="flex gap-5 items-center">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <Mail size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Email Us</span>
                      <a href="mailto:rilbongsanatanhindudharmasabha@gmail.com
" className="font-serif text-lg text-[var(--ink)] hover:text-[var(--maroon)] transition-colors break-all">rilbongsanatanhindudharmasabha@gmail.com</a>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            
          </div>
        </div>
      </section>

      {/* Policies Section - Vertical Accordion */}
      <section className="pb-32 bg-[var(--cream)]" id="policies">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              ['Terms & Conditions', 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. Rilbong Sanatan Hindu Dharma Sabha reserves the right to modify event details, timings, and venues due to unforeseen circumstances. Registration for events constitutes a binding agreement. You confirm that all information provided during registration is accurate. Unauthorized use of this website may give rise to a claim for damages. Any dispute arising out of use of the website is subject to the regulatory jurisdiction of the courts of Shillong, Meghalaya, India.'],
              ['Privacy Policy', 'Rilbong Sanatan Hindu Dharma Sabha is committed to protecting your privacy. We collect personal information (such as name, email, phone number, and address) solely for event registration, communication, and logistical coordination. We do not sell, trade, or rent your personal information to third parties. Financial transactions are processed securely through our payment gateway partner, Razorpay. We do not store your credit/debit card details or banking credentials on our servers. By using our website and registering for events, you consent to our data collection practices as outlined.'],
              ['Refund Policy', 'All event registration fees (including the Food Festival and Marathon) are strictly non-refundable and non-transferable under normal circumstances. If a participant fails to attend, no refund will be issued. In the rare event that The Sabha is forced to cancel or indefinitely postpone an event, registered participants will be notified via email, and full refunds will be initiated automatically. Once a refund is processed by our team, please allow 5 to 7 business days for the amount to reflect in your original payment method.'],
              ['Shipping & Delivery', 'Rilbong Sanatan Hindu Dharma Sabha handles event registrations digitally. No physical tickets or goods are shipped. Upon successful completion of your payment, a payment confirmation receipt will be automatically delivered to your registered email address. Please present this payment confirmation (digital or printed) at the venue on the day of the event as proof of registration.']
            ].map(([title, copy], index) => (
              <Reveal key={title} delay={index * 80}>
                <details className="border-t border-[var(--border)] group">
                  <summary className="flex items-center justify-between py-5 cursor-pointer list-none font-serif text-xl marker:hidden text-[var(--ink)]">
                    {title}
                    <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300 text-[var(--maroon)]" />
                  </summary>
                  <p className="pb-6 text-[var(--muted-foreground)] text-sm leading-relaxed text-justify">{copy}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--deep-maroon)] text-[#fffaf3]">
        <div className="container mx-auto px-6 max-w-[1180px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-12">
          <a className="flex flex-col leading-tight" href="#home">
            <strong className="text-[var(--gold)] font-serif text-xl tracking-tight">Rilbong Sanatan Hindu Dharma Sabha</strong>
            <small className="text-[10px] uppercase tracking-widest text-[#fffaf3]/60 mt-1">Community, Welfare & Tradition</small>
          </a>
          <p className="text-[#fffaf3]/60 font-serif text-xl italic">Community, welfare, and tradition — together.</p>
        </div>
        <div className="container mx-auto px-6 max-w-[1180px] flex flex-col md:flex-row justify-between items-center border-t border-white/10 py-5 text-white/50 text-[10px] tracking-widest uppercase gap-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#policies" className="hover:text-white transition-colors">Terms & Conditions</a>
            <a href="#policies" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#policies" className="hover:text-white transition-colors">Refund Policy</a>
            <a href="#policies" className="hover:text-white transition-colors">Shipping Details</a>
          </div>
          <div className="flex flex-wrap gap-4 text-center">
            <span>© 2026 Rilbong Sanatan Hindu Dharma Sabha</span>
            <span>Built with love</span>
          </div>
        </div>
      </footer>
    </main>
  )
}