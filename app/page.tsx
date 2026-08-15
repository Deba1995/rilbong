'use client'

import { useEffect, useState } from 'react'
import {
  ArrowUpRight, CalendarDays, Camera, Check, Clock, Flame, Footprints,
  Globe, Mail, MapPin, Menu, Phone, Play, Salad, ShieldCheck, Sparkles, Sun, Trophy, Users, X,
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

const timings = [
  { icon: Sun, label: 'Morning Aarti', value: '6:30 – 7:15 AM' },
  { icon: Flame, label: 'Sandhya Aarti', value: '6:00 – 6:45 PM' },
  { icon: Clock, label: 'Darshan Hours', value: '5:30 AM – 9:00 PM' },
  { icon: CalendarDays, label: 'Weekly Puja', value: 'Every Tuesday & Sunday' },
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
              <strong className="text-[var(--gold)] font-serif text-lg tracking-tight">Rilbong</strong>
              <small className="text-[8px] uppercase tracking-widest text-[#fffaf3]/70">Sanatan Hindu Dharma Sabha</small>
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
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden" id="home">
        <div className="absolute inset-0 z-0">
          <img 
            src="/mandap.jpeg" 
            alt="Rilbong Sanatan Hindu Dharma Sabha Mandap" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--deep-maroon)] via-[var(--maroon)]/80 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" /> 
        </div>
        
        <div className="container mx-auto px-6 max-w-[1180px] z-10 relative flex flex-col items-center text-center text-[#fffaf3] py-24">
          <Reveal>
            <p className="flex items-center justify-center gap-3 text-[var(--gold)] text-[11px] tracking-[0.2em] uppercase font-bold">
              <span className="w-8 h-px bg-[var(--gold)]" /> Serving since 1985 <span className="w-8 h-px bg-[var(--gold)]" />
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-8 text-[var(--gold)] text-[11px] font-bold tracking-[0.28em] drop-shadow-md">RILBONG / SHILLONG</p>
            <h1 className="mt-4 text-6xl md:text-8xl font-serif tracking-tighter leading-[0.9] drop-shadow-2xl">
              <em className="text-[var(--gold)] italic">Rilbong</em><br />in celebration.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-[#fffaf3]/90 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-lg">
              A community-run puja committee nurturing tradition, compassion, and the joyful spirit of Rilbong.
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
          
          <Reveal delay={300} className="w-full mt-24 pt-10 border-t border-white/20">
            <div className="flex flex-wrap justify-center gap-12 md:gap-24">
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal drop-shadow-md">40+</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Years of service</span>
              </div>
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal drop-shadow-md">1000+</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Community members</span>
              </div>
              <div className="flex flex-col">
                <strong className="text-[var(--gold)] font-serif text-4xl md:text-5xl font-normal drop-shadow-md">2</strong>
                <span className="text-[#fffaf3]/80 text-[10px] tracking-widest uppercase mt-3 font-bold">Festivals this season</span>
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
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap">FAITH · CULTURE · COMMUNITY</span><i className="text-[var(--gold)] text-xs not-italic">✦</i>
        </div>
      </div>

      {/* Timing Band */}
      <div className="bg-[var(--ink)] text-[#fffaf3]/90">
        <div className="container mx-auto px-6 max-w-[1180px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {timings.map((t, i) => (
            <div className={`flex items-center gap-4 py-6 px-4 border-b lg:border-b-0 lg:border-r border-white/10 ${i === timings.length - 1 ? 'border-r-0' : ''}`} key={t.label}>
              <div className="p-2.5 bg-[var(--gold)] text-[var(--ink)] rounded-full shrink-0"><t.icon size={16} /></div>
              <div><strong className="block font-serif text-base font-normal">{t.value}</strong><span className="text-[#fffaf3]/60 text-[10px] tracking-widest uppercase">{t.label}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* 100-Year Centennial Feature */}
      <section className="relative py-32 bg-[var(--deep-maroon)] text-[#fffaf3] overflow-hidden border-y-[4px] border-[var(--gold)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10" id="centennial">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(230,177,63,0.15)_0%,_transparent_60%)] pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-[1180px] relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="md:w-1/2 space-y-8">
            <Reveal>
              <div className="flex items-center gap-4">
                <span className="w-12 h-[2px] bg-[var(--gold)]"></span>
                <span className="text-[var(--gold)] text-xs font-bold tracking-[0.25em] uppercase">1927 — 2026</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-5xl md:text-7xl font-serif tracking-tight leading-[0.95]">
                A Century of<br /><em className="text-[var(--gold)] italic">Devotion.</em>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-[#fffaf3]/80 text-lg md:text-xl max-w-md font-medium leading-relaxed">
                This year marks a historic milestone: our 100th Durga Puja. Join us in honoring a hundred years of faith, culture, and the enduring spirit of the Shillong community.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <a href="#events" className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-[var(--gold)] text-[var(--gold)] font-bold text-sm rounded-full hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all duration-300">
                View Centennial Events <ArrowUpRight size={16} />
              </a>
            </Reveal>
          </div>
          
          <div className="md:w-1/2 flex justify-center items-center">
            <Reveal delay={200} className="relative grid place-items-center">
              <div className="text-[160px] md:text-[220px] font-serif font-bold text-[var(--gold)] leading-none tracking-tighter opacity-90 drop-shadow-[0_10px_40px_rgba(233,185,79,0.3)]">
                100
              </div>
              <div className="absolute text-3xl md:text-4xl font-serif italic text-[#fffaf3] mt-32 md:mt-40 drop-shadow-md">
                Years
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-24 space-y-32" id="about">
        
        {/* Part 1: Intro */}
        <div className="container mx-auto px-6 max-w-[1180px] grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-3 flex items-center gap-3 text-[var(--muted-foreground)] text-[10px] tracking-widest uppercase">
            <span className="text-[var(--saffron)] font-serif text-2xl">01</span><span>Our community</span>
          </div>
          <div className="lg:col-span-9 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight leading-[0.98]">Rooted in faith.<br /><span className="text-[var(--maroon)] italic">Open to all.</span></h2>
            </div>
            <div className="space-y-6">
              <p className="text-[var(--muted-foreground)] text-[15px]">Rilbong Sanatan Hindu Dharma Sabha is a not-for-profit community built by neighbours, for neighbours. Since 1927, we have gathered to celebrate our faith, preserve our cultural heritage, and extend a helping hand wherever it is needed.</p>
              <div className="flex gap-8 pt-6 border-t border-[var(--border)]">
                <div className="flex flex-col"><strong className="text-[var(--maroon)] font-serif text-3xl">3</strong><span className="text-[var(--muted-foreground)] text-[11px] mt-1">Weekly rituals held</span></div>
                <div className="flex flex-col"><strong className="text-[var(--maroon)] font-serif text-3xl">12</strong><span className="text-[var(--muted-foreground)] text-[11px] mt-1">Cultural events / year</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Part 2: The Story (Classic Editorial Frame) */}
        <div className="container mx-auto px-6 max-w-[1180px] grid md:grid-cols-2 gap-16 items-center">
          
          <Reveal className="relative grid place-items-center min-h-[460px]">
            {/* Classic Portrait Frame */}
            <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden group bg-[var(--card)]">
              {/* Background gradient (ready to be replaced by an image) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--maroon)] to-[var(--deep-maroon)] bg-pattern-rings opacity-95 group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute inset-0 flex items-center justify-center text-[var(--gold)]">
                <span className="font-serif text-[100px] opacity-40 drop-shadow-md">ॐ</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight leading-[0.98]">A tradition of care.</h2>
            <p className="text-[var(--muted-foreground)] text-[15px] max-w-md">What began as a small gathering of local families has grown into a shared home for generations. Our Sabha was founded by community members who believed that religious practice is most meaningful when lived together.</p>
            <div className="grid gap-4 mt-8 pt-8 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Promoting Sanatan Dharma values</div>
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Supporting neighbours in need</div>
              <div className="flex items-center gap-3 text-[var(--maroon)] text-sm"><span className="p-1 rounded-full bg-[var(--saffron)] text-[#fffaf3]"><Check size={14} /></span> Keeping culture alive for the next generation</div>
            </div>
          </Reveal>
        </div>

        {/* Part 3: Committee */}
        {/* <div className="container mx-auto px-6 max-w-[1180px] mt-12 pt-24 border-t border-[var(--border)]">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <Reveal>
              <SectionHeading 
                kicker="Leadership" 
                title="Guardians of Tradition." 
                copy="The dedicated individuals steering the Sabha into its next century of service." 
                className="mb-0" 
              />
            </Reveal>
            <Reveal delay={100}>
              <a href="#contact" className="inline-flex items-center gap-2 text-[var(--maroon)] font-bold text-sm hover:text-[var(--saffron)] transition-colors border-b-2 border-current pb-1">
                Reach out to the committee <ArrowUpRight size={16} />
              </a>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
            {committee.map((person, index) => (
              <Reveal key={person.name} delay={index * 70}>
                <div className="flex items-center gap-6 py-6 border-b border-[var(--border)] group cursor-default hover:border-[var(--gold)] transition-colors duration-300">
                  <div className="w-16 h-16 shrink-0 rounded-full bg-transparent text-[var(--maroon)] flex items-center justify-center font-serif text-xl border-2 border-[var(--maroon)]/20 group-hover:bg-[var(--gold)] group-hover:border-[var(--gold)] group-hover:text-[var(--ink)] transition-all duration-300 shadow-sm">
                    {person.initials}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-[var(--ink)] tracking-tight">{person.name}</h3>
                    <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mt-1">
                      {person.role}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div> */}

      </section>

      {/* Events Section */}
      <section className="py-24 bg-[#f1e4cf]" id="events">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <Reveal><SectionHeading kicker="02 / Upcoming Gatherings" title="Moments worth sharing" copy="Come as you are. Leave with a full heart — and perhaps a full plate." /></Reveal>
          
          <div className="mt-16 space-y-8">
            
            {/* Event 1: Food Festival */}
            <Reveal delay={100}>
              <article className="grid md:grid-cols-12 overflow-hidden bg-[var(--card)] border border-[#7a1c1c]/15 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
                <div className="md:col-span-5 relative grid place-items-center min-h-[300px] overflow-hidden bg-gradient-to-br from-[var(--maroon)] to-[#a3312c] bg-pattern-dots">
                  <span className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0_rgb(50_23_20/28%)]">Taste & Tradition</span>
                  <Salad className="relative z-10 w-24 h-24 text-[#fffaf3] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" />
                </div>
                <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.13em] uppercase">3 October 2026</span>
                  <h3 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight leading-[0.95]">Rilbong Centennial<br />Food Festival 2026</h3>
                  <p className="mt-4 text-[var(--muted-foreground)] text-base max-w-md">Celebrate the abundance of home cooking talent in our community. A joyful table of beloved recipes, shared stories, and the men and women who make Rilbong taste like home.</p>
                  
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[var(--border)] text-[var(--muted-foreground)] text-xs">
                    <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--maroon)]" /> 3rd Oct, 9:00 AM - 4:00 PM</span>
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--maroon)]" /> Rilbong Maidan</span>
                    <span className="flex items-center gap-2"><Trophy size={16} className="text-[var(--maroon)]" /> Entry Fee: ₹500</span>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--maroon)] text-[#fffaf3] font-bold text-sm rounded-full hover:bg-[var(--deep-maroon)] hover:-translate-y-0.5 transition-all">Register Now <ArrowUpRight size={16} /></button>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* Event 2: Marathon */}
            <Reveal delay={200}>
              <article className="grid md:grid-cols-12 overflow-hidden bg-[var(--card)] border border-[#7a1c1c]/15 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
                <div className="md:col-span-5 relative grid place-items-center min-h-[300px] overflow-hidden bg-gradient-to-br from-[var(--marigold)] to-[var(--gold)] bg-pattern-dots md:order-last">
                  <span className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-[var(--maroon)] text-[#fffaf3] text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0_rgb(50_23_20/28%)]">Run for Good</span>
                  <Footprints className="relative z-10 w-24 h-24 text-[var(--ink)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
                </div>
                <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.13em] uppercase">2 October 2026</span>
                  <h3 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight leading-[0.95]">Rilbong Centennial<br />Marathon</h3>
                  <p className="mt-4 text-[var(--muted-foreground)] text-base max-w-md">Every stride is a promise to do more. Join our community run supporting local welfare initiatives, open to everyone in Shillong.</p>
                  
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[var(--border)] text-[var(--muted-foreground)] text-xs">
                    <span className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--maroon)]" /> 2nd Oct, 5:15 AM Report • 6:00 AM Flag Off</span>
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--maroon)]" /> Rhino Museum Point → Rilbong Puja Mandap</span>
                    <span className="flex items-center gap-2"><Trophy size={16} className="text-[var(--maroon)]" /> Entry Fee: ₹300</span>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--gold)] text-[var(--ink)] font-bold text-sm rounded-full hover:bg-[var(--marigold)] hover:-translate-y-0.5 transition-all">Register Now <ArrowUpRight size={16} /></button>
                  </div>
                </div>
              </article>
            </Reveal>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-[var(--cream)]" id="contact">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            <Reveal>
              <SectionHeading 
                kicker="03 / Say Hello" 
                title="Our door is always open." 
                copy="Whether you have a question about our upcoming events, wish to contribute to our charitable initiatives, or simply want to say namaste, we would be honored to hear from you." 
              />
            </Reveal>
            
            <Reveal delay={100}>
              <div className="bg-[var(--card)] border border-[var(--gold)]/30 rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                
                {/* Decorative background Om */}
                <div className="absolute -bottom-10 -right-10 text-[var(--gold)] opacity-5 rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <span className="text-[200px] leading-none font-serif">ॐ</span>
                </div>
                
                <div className="relative z-10 space-y-10">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Visit Us</span>
                      <address className="not-italic font-serif text-xl text-[var(--ink)] leading-snug">
                        Near Rilbong Maidan,<br />Shillong, Meghalaya - 793003
                      </address>
                    </div>
                  </div>
                  
                  <div className="flex gap-5 items-center">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <Phone size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Call Us</span>
                      <a href="tel:+919876543210" className="font-serif text-xl text-[var(--ink)] hover:text-[var(--maroon)] transition-colors">+91 98765 43210</a>
                    </div>
                  </div>

                  <div className="flex gap-5 items-center">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--maroon)]/10 text-[var(--maroon)] flex items-center justify-center border border-[var(--maroon)]/20">
                      <Mail size={20} />
                    </div>
                    <div>
                      <span className="text-[var(--saffron)] text-[10px] font-bold tracking-[0.15em] uppercase block mb-1">Email Us</span>
                      <a href="mailto:contact@rilbongsanatanhindudharmasabha.org" className="font-serif text-lg text-[var(--ink)] hover:text-[var(--maroon)] transition-colors break-all">contact@rilbong<wbr/>sanatanhindu<wbr/>dharmasabha.org</a>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="pb-24 bg-[var(--cream)]">
        <div className="container mx-auto px-6 max-w-[1180px]">
          <Reveal>
            <div className="pt-12 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                ['Terms & Conditions', 'We ask every participant to register honestly, follow event guidelines, and conduct themselves with respect. The Sabha reserves the right to modify event details when necessary. One entry is allowed per category per person. These terms are governed by the laws of India.'],
                ['Privacy Policy', 'We collect information such as name, email, phone, address, age, and gender only through registration forms for event coordination. Personal and contact details are handled securely and are never stored for unsolicited purposes.'],
                ['Refund Policy', 'Entry fees are non-refundable once paid. If an event is cancelled or postponed by the organizers, a full refund may be requested within 7 working days by contacting us. Refunds are processed after verification.'],
              ].map(([title, copy], index) => (
                <div key={title}>
                  <h4 className="font-serif text-lg text-[var(--ink)] mb-3">{title}</h4>
                  <p className="text-[var(--muted-foreground)] text-xs leading-relaxed text-justify">{copy}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--deep-maroon)] text-[#fffaf3]">
        <div className="container mx-auto px-6 max-w-[1180px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-12">
          <a className="flex flex-col leading-tight" href="#home">
            <strong className="text-[var(--gold)] font-serif text-xl tracking-tight">Rilbong</strong>
            <small className="text-[10px] uppercase tracking-widest text-[#fffaf3]/60 mt-1">Sanatan Hindu Dharma Sabha</small>
          </a>
          <p className="text-[#fffaf3]/60 font-serif text-xl italic">Faith, community, and tradition — together.</p>
          {/* <div className="flex gap-3">
            <a href="#" className="grid place-items-center w-10 h-10 border border-white/20 rounded-full hover:bg-[var(--maroon)] hover:-translate-y-1 transition-all"><Globe size={18} /></a>
            <a href="#" className="grid place-items-center w-10 h-10 border border-white/20 rounded-full hover:bg-[var(--maroon)] hover:-translate-y-1 transition-all"><Camera size={18} /></a>
            <a href="#" className="grid place-items-center w-10 h-10 border border-white/20 rounded-full hover:bg-[var(--maroon)] hover:-translate-y-1 transition-all"><Play size={18} /></a>
          </div> */}
        </div>
        <div className="container mx-auto px-6 max-w-[1180px] flex flex-col md:flex-row justify-between border-t border-white/10 py-5 text-white/50 text-[10px] tracking-widest uppercase">
          <span>© 2026 Rilbong Sanatan Hindu Dharma Sabha</span>
          <span>Built with love</span>
        </div>
      </footer>
    </main>
  )
}