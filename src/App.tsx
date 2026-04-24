/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  MapPin, 
  Mail, 
  Phone, 
  Ship, 
  CreditCard, 
  Leaf, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Globe,
  Award,
  Lock,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  MessageCircle,
  Eye,
  Package,
  CheckCircle,
  Clock,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';

// --- Types ---
type Page = 'home' | 'about' | 'products' | 'export' | 'sustainability' | 'contact' | 'admin' | 'dashboard';

interface InquiryData {
  id?: string;
  fullName: string;
  companyName: string;
  email: string;
  type: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  createdAt: any;
}

// --- Translations ---
const translations = {
  en: {
    home: "Home",
    about: "About Us",
    products: "Our Products",
    export: "Export Procedure",
    inquiry: "Inquiry",
    admin: "Admin",
    explore_products: "Explore Products",
    request_sample: "Request a Sample",
    premium_grade: "Premium Grade Only",
    premium_grade_desc: "We strictly hand-pick crops to ensure maximum moisture control and purity levels that exceed international standards.",
    direct_farm: "Direct Farm Sourcing",
    direct_farm_desc: "Our roots in the farming community allow us to maintain 100% traceability and provide competitive B2B direct pricing.",
    sustainable: "Sustainable Growth",
    sustainable_desc: "Ethical farming practices that protect our soil and empower local cooperatives for a resilient spice supply chain.",
    growing_process: "Our Growing Process",
    growing_process_desc: "Take a closer look at our traditional farming methods and the high standard of processing that makes our Long Pepper unique.",
    quick_links: "Quick Links",
    certificates: "Certificates",
    connect: "Connect",
    heritage: "Our Heritage",
    heritage_title: "Empowering Traditional Indonesian Spices for the Global Stage.",
    heritage_p1: "Nusantara Long Pepper began as a collective of local farmers in West Java. Recognizing the unique quality of Javanese Long Pepper (Cabe Jamu) in our region, we transformed from small-scale suppliers into a professional export entity.",
    heritage_p2: "Our mission is simple: To provide the international pharmaceutical, food, and beverage industries with a reliable, high-volume source of authentic Indonesian spices while ensuring fair trade for our farming communities.",
    quality_approach: "Quality First Approach",
    quality_p1: "From the fertile soils of Java to our modern processing facilities, every step is monitored. We use solar-drying combined with mechanical moisture control to preserve the essential oils and piperine levels.",
    quality_p2: "Our facilities are registered and comply with global food safety guidelines, ensuring that our products arrive at your destination in perfect condition.",
    authentic_origin: "Authentic Origin",
    authentic_origin_desc: "Sourced exclusively from the unique micro-climates of West Java.",
    scientific_assurance: "Scientific Assurance",
    scientific_assurance_desc: "Regular laboratory testing for moisture, ash content, and chemical compounds.",
    scale_reliability: "Scale Reliability",
    scale_reliability_desc: "Capable of supplying up to 50 metric tons monthly through our farmer networks.",
    product_specs: "Product Specifications",
    product_desc: "The Javanese Long Pepper (Piper retrofractum Vahl) is prized for its pungent heat and sweet, herbal undertones.",
    technical_datasheet: "Technical Datasheet",
    standard_package: "Standard Document Package",
    partnership_title: "Start a Partnership",
    partnership_desc: "For volume inquiries, sample requests, or technical questionnaires, please fill out the form below. Our export desk will contact you within 24 business hours.",
    sending: "Sending...",
    send_inquiry: "Send Inquiry",
    success_message: "Thank you, we will respond by replying to your email.",
    language: "Website Language",
    en_lang: "English",
    id_lang: "Indonesia"
  },
  id: {
    home: "Beranda",
    about: "Tentang Kami",
    products: "Produk Kami",
    export: "Prosedur Ekspor",
    inquiry: "Pertanyaan",
    admin: "Admin",
    explore_products: "Jelajahi Produk",
    request_sample: "Minta Sampel",
    premium_grade: "Hanya Kualitas Premium",
    premium_grade_desc: "Kami memilih tanaman secara ketat untuk memastikan kontrol kelembaban maksimum dan tingkat kemurnian yang melampaui standar internasional.",
    direct_farm: "Sumber Langsung dari Petani",
    direct_farm_desc: "Akar kami di komunitas petani memungkinkan kami untuk mempertahankan keterlacakan 100% dan memberikan harga B2B langsung yang kompetitif.",
    sustainable: "Pertumbuhan Berkelanjutan",
    sustainable_desc: "Praktik pertanian etis yang melindungi tanah kami dan memberdayakan koperasi lokal untuk rantai pasokan rempah yang tangguh.",
    growing_process: "Proses Penanaman Kami",
    growing_process_desc: "Lihat lebih dekat metode pertanian tradisional kami dan standar tinggi pemrosesan yang membuat Lada Panjang kami unik.",
    quick_links: "Tautan Cepat",
    certificates: "Sertifikat",
    connect: "Hubungi Kami",
    heritage: "Warisan Kami",
    heritage_title: "Memberdayakan Rempah Tradisional Indonesia untuk Panggung Global.",
    heritage_p1: "Nusantara Long Pepper berawal sebagai kolektif petani lokal di Jawa Barat. Menyadari kualitas unik Lada Panjang Jawa (Cabe Jamu) di wilayah kami, kami bertransformasi dari pemasok skala kecil menjadi entitas ekspor profesional.",
    heritage_p2: "Misi kami sederhana: Menyediakan sumber Lada Panjang Indonesia yang otentik dan bervolume tinggi untuk industri farmasi, makanan, dan minuman internasional sambil memastikan perdagangan yang adil bagi komunitas petani kami.",
    quality_approach: "Pendekatan Kualitas Utama",
    quality_p1: "Dari tanah subur Jawa hingga fasilitas pemrosesan modern kami, setiap langkah dipantau. Kami menggunakan pengeringan matahari yang dikombinasikan dengan kontrol kelembaban mekanis untuk menjaga minyak esensial dan tingkat piperin.",
    quality_p2: "Fasilitas kami terdaftar dan mematuhi pedoman keamanan pangan global, memastikan produk kami tiba di tujuan dalam kondisi sempurna.",
    authentic_origin: "Asal Otentik",
    authentic_origin_desc: "Bersumber secara eksklusif dari iklim mikro unik di Jawa Barat.",
    scientific_assurance: "Jaminan Ilmiah",
    scientific_assurance_desc: "Pengujian laboratorium rutin untuk kelembaban, kadar abu, dan senyawa kimia.",
    scale_reliability: "Keandalan Skala",
    scale_reliability_desc: "Mampu menyuplai hingga 50 metrik ton setiap bulan melalui jaringan petani kami.",
    product_specs: "Spesifikasi Produk",
    product_desc: "Lada Panjang Jawa (Piper retrofractum Vahl) dihargai karena rasa pedasnya dan aroma herbal yang manis.",
    technical_datasheet: "Lembar Data Teknis",
    standard_package: "Paket Dokumen Standar",
    partnership_title: "Mulai Kemitraan",
    partnership_desc: "Untuk pertanyaan volume, permintaan sampel, atau kuesioner teknis, silakan isi formulir di bawah ini. Meja ekspor kami akan menghubungi Anda dalam waktu 24 jam kerja.",
    sending: "Mengirim...",
    send_inquiry: "Kirim Pertanyaan",
    success_message: "Terima kasih, kami akan merespon dengan membalas pada email anda.",
    language: "Bahasa Situs Web",
    en_lang: "Inggris",
    id_lang: "Indonesia"
  }
};

// --- Components ---

const Navbar = ({ currentPage, setPage, user, t }: { currentPage: Page, setPage: (p: Page) => void, user: User | null, t: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user?.email === 'pramukapattimura@gmail.com' || user?.email === 'min8ciamis@gmail.com' || user?.email === 'yasidaifada@gmail.com';

  const navItems: { label: string; value: Page }[] = [
    { label: t.home, value: 'home' },
    { label: t.about, value: 'about' },
    { label: t.products, value: 'products' },
    { label: t.export, value: 'export' },
    { label: t.inquiry, value: 'contact' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center cursor-pointer gap-3" onClick={() => setPage('home')}>
            <img src="/src/logo.png" alt="Yasida Logo" className="h-12 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-serif font-bold tracking-tighter text-emerald-900">YASIDA</span>
              <span className="text-[10px] font-serif font-light text-stone-500">CORPORATION</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <button
                key={item.value}
                id={`nav-item-${item.value}`}
                onClick={() => setPage(item.value)}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.value ? 'text-emerald-700 underline underline-offset-8' : 'text-stone-600 hover:text-emerald-600'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                id="nav-admin-dashboard"
                onClick={() => setPage('dashboard')}
                className="flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full cursor-pointer"
              >
                <LayoutDashboard size={14} /> {t.admin}
              </button>
            )}
            {!user ? (
               <button id="nav-login" onClick={() => setPage('admin')} className="text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer">
                 <Lock size={18} />
               </button>
            ) : (
              <button id="nav-logout" onClick={() => signOut(auth)} className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer">
                <LogOut size={18} />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-stone-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setPage(item.value);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-4 text-base font-medium text-stone-700 hover:bg-stone-50"
                >
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => { setPage('dashboard'); setIsOpen(false); }}
                  className="block w-full text-left px-3 py-4 text-base font-bold text-emerald-800"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = ({ setPage, settings }: { setPage: (p: Page) => void, settings: any }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:col-cols-4 gap-12 border-b border-stone-800 pb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <span className="text-2xl font-serif font-bold text-white tracking-tighter">YASIDA</span>
              <span className="text-2xl font-serif font-light text-stone-500 ml-1">CORPORATION</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 mb-8">
              Under YASIDA CORPORATION, Nusantara Pepper is Indonesia's leading supplier of premium Javanese Long Pepper. Bridging traditional heritage with international standard excellence.
            </p>
            <div className="flex gap-4">
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-emerald-800 transition-colors">
                  <Facebook size={18} />
                </a>
              )}
              {settings?.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-emerald-800 transition-colors">
                  <Instagram size={18} />
                </a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-emerald-800 transition-colors">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li className="cursor-pointer hover:text-white" onClick={() => setPage('about')}>About Us</li>
              <li className="cursor-pointer hover:text-white" onClick={() => setPage('products')}>Our Products</li>
              <li className="cursor-pointer hover:text-white" onClick={() => setPage('export')}>Export Terms</li>
              <li className="cursor-pointer hover:text-white" onClick={() => setPage('contact')}>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6">Certificates</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-2"><Award size={16} className="text-emerald-500" /> Phytosanitary Certified</li>
              <li className="flex items-center gap-2"><Award size={16} className="text-emerald-500" /> Origin Verification</li>
              <li className="flex items-center gap-2"><Award size={16} className="text-emerald-500" /> Export Registered</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6">Connect</h4>
            <div className="flex flex-col space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-500 shrink-0" />
                <span>Ciamis, West Java, Indonesia</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-emerald-500 shrink-0" />
                <span>yasidaifada@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-emerald-500 shrink-0" />
                <span>+6281216936231</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-stone-800 text-xs text-stone-500 text-center">
          © {new Date().getFullYear()} Nusantara Long Pepper. All rights reserved. Registered Export Supplier ID: ID-JX-0988.
        </div>
      </div>
    </footer>
  );
};

// --- Page Components ---

const Home = ({ setPage, settings, t }: { setPage: (p: Page) => void, settings: any, t: any }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const defaultSlides = [
    {
      title: t.home_slide1_title || "Sourcing the Finest Javanese Long Pepper",
      description: t.home_slide1_desc || "Direct from Indonesian farmers to the global market. We provide premium grade Javanese Long Pepper (Piper retrofractum Vahl) with unmatched chemical purity.",
      image: "https://picsum.photos/seed/pepper1/1920/1080",
      accent: "text-emerald-800"
    },
    {
      title: t.home_slide2_title || "Excellence in Agricultural Export",
      description: t.home_slide2_desc || "Certified quality standards meeting international pharmaceutical and food grade requirements. Hand-picked and sun-dried for perfection.",
      image: "https://picsum.photos/seed/pepper2/1920/1080",
      accent: "text-amber-800"
    },
    {
      title: t.home_slide3_title || "Sustainable Spice Supply Chain",
      description: t.home_slide3_desc || "Empowering local cooperatives in West Java while preserving traditional farming heritage for a resilient global spice market.",
      image: "https://picsum.photos/seed/pepper3/1920/1080",
      accent: "text-stone-800"
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'slides'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setSlides(defaultSlides);
      } else {
        setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides, currentSlide]);

  if (slides.length === 0) return <div className="min-h-screen bg-stone-50" />; 

  const activeSlide = slides[currentSlide] || slides[0] || {};
  if (!activeSlide.image) return <div className="min-h-screen bg-stone-50" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero Slider Section */}
      <section className="pt-20 bg-stone-50 overflow-hidden relative min-h-[600px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-white/60 md:bg-transparent md:bg-gradient-to-r md:from-stone-50 md:via-stone-50/80 md:to-transparent z-10" />
            <img 
              src={activeSlide.image} 
              alt="Slide Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-stone-900 leading-[1.1] mb-8">
                  {(activeSlide.title || "").split(" ").slice(0, -3).join(" ")} <br />
                  <span className={`${activeSlide.accent || 'text-emerald-800'} italic`}>
                    {(activeSlide.title || "").split(" ").slice(-3).join(" ")}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-stone-700 leading-relaxed mb-10 max-w-2xl">
                  {activeSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                id="hero-explore-btn"
                onClick={() => setPage('products')}
                className="px-8 py-4 bg-emerald-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-lg cursor-pointer"
              >
                {t.explore_products} <ArrowRight size={18} />
              </button>
              <button 
                id="hero-sample-btn"
                onClick={() => setPage('contact')}
                className="px-8 py-4 border border-stone-300 bg-white/50 backdrop-blur text-stone-700 font-medium hover:bg-stone-100 transition-all cursor-pointer"
              >
                {t.request_sample}
              </button>
            </motion.div>

            {/* Slide Indicators */}
            <div className="mt-16 flex gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1 transition-all duration-500 rounded-full ${
                    currentSlide === idx ? 'w-12 bg-emerald-800' : 'w-6 bg-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

    {/* USP Section */}
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center md:text-left">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center rounded-full text-emerald-700 mx-auto md:mx-0">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-medium text-stone-900">{t.premium_grade}</h3>
            <p className="text-stone-600 leading-relaxed">{t.premium_grade_desc}</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center rounded-full text-emerald-700 mx-auto md:mx-0">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-medium text-stone-900">{t.direct_farm}</h3>
            <p className="text-stone-600 leading-relaxed">{t.direct_farm_desc}</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center rounded-full text-emerald-700 mx-auto md:mx-0">
              <Leaf size={24} />
            </div>
            <h3 className="text-xl font-medium text-stone-900">{t.sustainable}</h3>
            <p className="text-stone-600 leading-relaxed">{t.sustainable_desc}</p>
          </div>
        </div>
      </div>
    </section>

    {/* Video Section */}
    {settings?.videoUrl && (
      <section className="py-24 bg-stone-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 mb-4">{t.growing_process}</h2>
            <div className="w-20 h-1 bg-emerald-700 mb-6" />
            <p className="text-stone-600 max-w-2xl leading-relaxed">
              {t.growing_process_desc}
            </p>
          </div>
          <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
            <iframe
              src={settings.videoUrl}
              title="Our Growing Process"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    )}
  </motion.div>
  );
};

const About = ({ t }: { t: any }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-16">
        <h2 className="text-sm font-medium text-emerald-700 uppercase tracking-widest mb-4">{t.heritage}</h2>
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 leading-tight mb-8">{t.heritage_title}</h1>
        <p className="text-lg text-stone-600 leading-relaxed mb-6">
          {t.heritage_p1}
        </p>
        <p className="text-lg text-stone-600 leading-relaxed">
          {t.heritage_p2}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-16 border-t border-stone-200">
        <div>
          <h3 className="text-2xl font-serif font-medium text-stone-900 mb-4">{t.quality_approach}</h3>
          <p className="text-stone-600 leading-relaxed mb-4">
            {t.quality_p1}
          </p>
          <p className="text-stone-600 leading-relaxed">
            {t.quality_p2}
          </p>
        </div>
        <div className="bg-stone-50 p-8 rounded-lg">
          <ul className="space-y-6">
            <li className="flex gap-4">
              <span className="text-emerald-700 font-serif text-3xl font-bold">01</span>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">{t.authentic_origin}</h4>
                <p className="text-sm text-stone-600">{t.authentic_origin_desc}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-emerald-700 font-serif text-3xl font-bold">02</span>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">{t.scientific_assurance}</h4>
                <p className="text-sm text-stone-600">{t.scientific_assurance_desc}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="text-emerald-700 font-serif text-3xl font-bold">03</span>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">{t.scale_reliability}</h4>
                <p className="text-sm text-stone-600">{t.scale_reliability_desc}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </motion.div>
);

const Products = ({ t }: { t: any }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 leading-tight">{t.product_specs}</h1>
        <p className="text-stone-600 mt-4 max-w-2xl">{t.product_desc}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Product Card */}
        <div className="lg:w-1/2">
          <div className="bg-stone-50 rounded-2xl overflow-hidden aspect-[4/5] relative">
             <div className="absolute inset-0 flex items-center justify-center text-stone-300">
               <Ship size={120} strokeWidth={1} />
             </div>
             <div className="absolute bottom-10 left-10 text-white z-10">
               <span className="bg-emerald-800 px-3 py-1 text-xs font-bold rounded mb-2 inline-block">PREMIUM GRADE A</span>
               <h2 className="text-3xl font-serif text-stone-900">Dried Javanese Long Pepper</h2>
             </div>
          </div>
        </div>

        {/* Specs Table */}
        <div className="lg:w-1/2 space-y-12">
          <div>
            <h3 className="text-2xl font-serif font-medium text-stone-900 mb-6 border-b pb-4">{t.technical_datasheet}</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Scientific Name', value: 'Piper retrofractum Vahl' },
                { label: 'Common Name', value: 'Javanese Long Pepper / Cabe Jamu' },
                { label: 'Form', value: 'Whole Dried Fruit' },
                { label: 'Origin', value: 'West Java, Indonesia' },
                { label: 'Moisture Level', value: '10% - 12% Max' },
                { label: 'Admixture / Purity', value: '0.5% Max (99.5% Pure)' },
                { label: 'Color', value: 'Dark Brown to Blackish' },
                { label: 'Size', value: '2 cm - 5 cm Average' },
                { label: 'Packaging', value: '25kg PP Bags / Custom Jute Bags' },
                { label: 'Monthly Capacity', value: '50 Metric Tons' }
              ].map((spec) => (
                <div key={spec.label} className="flex justify-between py-2 border-b border-stone-100 text-sm">
                  <span className="text-stone-500">{spec.label}</span>
                  <span className="font-medium text-stone-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 text-white p-8 rounded-xl shadow-xl">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={20} />
              Quality Standards
            </h4>
            <p className="text-stone-400 text-sm leading-relaxed">
              Our Long Pepper undergoes a multi-stage cleaning process to remove extraneous matter. We conduct steam-sterilization upon request to meet stringent microbial requirements for international food and pharma exports.
            </p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const ExportProcedure = ({ t }: { t: any }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 mb-6">Trade Transparency</h1>
        <p className="text-lg text-stone-600 leading-relaxed">
          We offer clear, standardized procedures to ensure a seamless B2B transaction experience for our global partners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="border border-stone-200 p-10 rounded-2xl bg-stone-50">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg mb-6">
            <CreditCard size={24} />
          </div>
          <h3 className="text-xl font-medium mb-4">Payment Terms</h3>
          <ul className="space-y-4 text-stone-600">
            <li className="flex gap-3">
              <ChevronRight className="text-emerald-600 shrink-0 mt-1" size={16} />
              <div>
                <p className="font-medium text-stone-900">Telegraphic Transfer (T/T)</p>
                <p className="text-sm">50% Down Payment against Sales Contract, 50% balance against Bill of Lading (B/L) scan.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="text-emerald-600 shrink-0 mt-1" size={16} />
              <div>
                <p className="font-medium text-stone-900">Irrevocable L/C at Sight</p>
                <p className="text-sm">For shipments exceeding 10 Metric Tons. Must be issued by a reputable international bank.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="border border-stone-200 p-10 rounded-2xl bg-stone-50">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg mb-6">
            <Ship size={24} />
          </div>
          <h3 className="text-xl font-medium mb-4">Shipping & Logistics</h3>
          <ul className="space-y-4 text-stone-600">
            <li className="flex gap-3">
              <ChevronRight className="text-emerald-600 shrink-0 mt-1" size={16} />
              <div>
                <p className="font-medium text-stone-900">Incoterms 2020</p>
                <p className="text-sm">FOB (Tanjung Priok, Jakarta), CNF, or CIF terms are available based on preference.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="text-emerald-600 shrink-0 mt-1" size={16} />
              <div>
                <p className="font-medium text-stone-900">Lead Time</p>
                <p className="text-sm">Typically 14–21 days from payment receipt to port departure, depending on quantity.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-emerald-900 text-white rounded-3xl p-12 overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-serif mb-6">Standard Document Package</h3>
          <p className="text-emerald-100 mb-8">Every export shipment is accompanied by a full legal document set including:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Invoice & Packing List</div>
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Bill of Lading (B/L)</div>
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Certificate of Origin (COO)</div>
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Phytosanitary Certificate</div>
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Fumigation Certificate</div>
             <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Lab Analysis Report</div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Globe size={400} />
        </div>
      </div>
    </div>
  </motion.div>
);

const Sustainability = ({ t }: { t: any }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-sm font-medium text-emerald-700 uppercase tracking-widest mb-4">Core Philosophy</h2>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 leading-tight mb-8">Harvesting for a <br /><span className="italic">Better Future.</span></h1>
          <p className="text-lg text-stone-600 leading-relaxed mb-6">
            {t.heritage_p1}
          </p>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg text-emerald-800 font-bold">1</div>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">Regenerative Farming</h4>
                <p className="text-sm text-stone-600">Training farmers in organic composting and natural pest management to eliminate chemical residues.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg text-emerald-800 font-bold">2</div>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">Fair Economic Circles</h4>
                <p className="text-sm text-stone-600">Paying minimum 15% above traditional market rates to ensure local stability and education for the next generation.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg text-emerald-800 font-bold">3</div>
              <div>
                <h4 className="font-medium text-stone-900 mb-1">{t.authentic_origin}</h4>
                <p className="text-sm text-stone-600">{t.authentic_origin_desc}</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="bg-stone-50 rounded-3xl p-12 border border-stone-200">
           <div className="aspect-square bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-6">
              <Leaf size={64} className="text-emerald-700" />
              <h3 className="text-2xl font-serif text-emerald-900">100% Pesticide Free Commitment</h3>
              <p className="text-stone-600 leading-relaxed">Our long-term goal is to transition our entire network to certified organic status, preserving the biodiversity of the Javanese landscape.</p>
           </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const Contact = ({ t }: { t: any }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    type: 'Trial Sample Shipment',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSent(true);
      setFormData({ fullName: '', companyName: '', email: '', type: 'Trial Sample Shipment', message: '' });
      setTimeout(() => setSent(false), 8000);
    } catch (error) {
      handleFirestoreError(error, 'create', 'inquiries');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 mb-6">{t.partnership_title}</h1>
            <p className="text-lg text-stone-600 leading-relaxed mb-10">
              {t.partnership_desc}
            </p>
            <div className="space-y-6">
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-100 flex gap-4">
                 <Globe className="text-emerald-700" size={24} />
                 <div>
                   <h4 className="font-medium text-stone-900">{t.connect}</h4>
                   <p className="text-stone-500 text-sm">Ciamis, West Java, Indonesia</p>
                 </div>
              </div>
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-100 flex gap-4">
                 <ShieldCheck className="text-emerald-700" size={24} />
                 <div>
                   <h4 className="font-medium text-stone-900">{t.certificates}</h4>
                   <p className="text-stone-500 text-sm">Registrar No: 8820-ID-EX-SNI</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-10 shadow-sm relative overflow-hidden">
            <AnimatePresence>
              {sent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-emerald-800 text-white flex flex-col items-center justify-center p-12 text-center z-20"
                >
                  <CheckCircle size={64} className="mb-6" />
                  <h3 className="text-3xl font-serif mb-4">Inquiry Received</h3>
                  <p className="text-emerald-100 mb-8">{t.success_message}</p>
                  <button onClick={() => setSent(false)} className="px-8 py-3 bg-white text-emerald-900 font-bold rounded-lg hover:bg-emerald-50">
                    Send Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Full Name</label>
                  <input 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Company Name</label>
                  <input 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Work Email</label>
                <input 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  type="email" 
                  className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Interest / Inquiry Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                >
                  <option>Trial Sample Shipment</option>
                  <option>Full FCL Inquiry (Metric Tons)</option>
                  <option>LCL Inquiry</option>
                  <option>Technical Data Request</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Message</label>
                <textarea 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4} 
                  className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder={t.product_desc}
                ></textarea>
              </div>
              <button 
                disabled={sending}
                className="w-full py-4 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all rounded disabled:opacity-50 cursor-pointer"
              >
                {sending ? t.sending : t.send_inquiry}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminLogin = ({ setPage }: { setPage: (p: Page) => void }) => {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email === 'pramukapattimura@gmail.com' || result.user.email === 'min8ciamis@gmail.com' || result.user.email === 'yasidaifada@gmail.com') {
        setPage('dashboard');
      } else {
        setError('Unauthorized access. Only authorized admins can enter.');
        await signOut(auth);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-48 flex justify-center px-4">
      <div className="max-w-md w-full bg-white border border-stone-200 p-10 rounded-3xl text-center">
        <Lock size={48} className="mx-auto text-emerald-800 mb-6" />
        <h2 className="text-3xl font-serif mb-4">Admin Access</h2>
        <p className="text-stone-500 mb-8 italic">Restricted portal for Nusantara Pepper export management.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">{error}</div>}
        
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-4 rounded hover:bg-stone-800 transition-all font-medium"
        >
          Sign in with Google
        </button>
        <button onClick={() => setPage('home')} className="mt-6 text-sm text-stone-400 hover:text-stone-600">
          Back to Website
        </button>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ settings }: { settings: any }) => {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'slides' | 'settings'>('inquiries');
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [viewingInquiry, setViewingInquiry] = useState<InquiryData | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubInquiries = onSnapshot(qInquiries, (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InquiryData)));
      setLoading(false);
    });

    const qSlides = query(collection(db, 'slides'), orderBy('order', 'asc'));
    const unsubSlides = onSnapshot(qSlides, (snapshot) => {
      setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubInquiries();
      unsubSlides();
    };
  }, []);

  const updateStatus = async (id: string, status: InquiryData['status']) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status });
    } catch (err) {
      handleFirestoreError(err, 'update', `inquiries/${id}`);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inquiry permanently?')) {
      try {
        await deleteDoc(doc(db, 'inquiries', id));
      } catch (err) {
        handleFirestoreError(err, 'delete', `inquiries/${id}`);
      }
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSlide.id) {
        const { id, ...data } = editingSlide;
        await updateDoc(doc(db, 'slides', id), data);
      } else {
        await addDoc(collection(db, 'slides'), { ...editingSlide, order: slides.length });
      }
      setEditingSlide(null);
    } catch (err) {
      handleFirestoreError(err, 'write', 'slides');
    }
  };

  const deleteSlide = async (id: string) => {
    if (window.confirm('Delete this slide?')) {
      try {
        await deleteDoc(doc(db, 'slides', id));
      } catch (err) {
        handleFirestoreError(err, 'delete', `slides/${id}`);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'global'), localSettings);
      alert('Settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, 'write', 'settings/global');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-medium text-stone-900">Export Desk Dashboard</h1>
          <p className="text-stone-500 mt-2">Managing global B2B leads, media, and home content.</p>
        </div>
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl whitespace-nowrap overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500'}`}
          >
            Inquiries
          </button>
          <button 
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'slides' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500'}`}
          >
            Carousel
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'inquiries' ? (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-400">
                  <th className="px-6 py-5">Sender</th>
                  <th className="px-6 py-5">Company & Type</th>
                  <th className="px-6 py-5">Message Snippet</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400">Loading inquiries...</td></tr>
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400">No inquiries yet.</td></tr>
                ) : inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-6" title={item.fullName}>
                      <p className="font-medium text-stone-900 truncate max-w-[150px]">{item.fullName}</p>
                      <p className="text-xs text-stone-500 truncate max-w-[150px]">{item.email}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-medium text-stone-700 truncate max-w-[150px]">{item.companyName || 'Private'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 text-[10px] font-bold rounded uppercase">{item.type}</span>
                    </td>
                    <td className="px-6 py-6" title={item.message}>
                      <p className="text-sm text-stone-600 line-clamp-2 max-w-xs">{item.message}</p>
                    </td>
                    <td className="px-6 py-6 text-sm text-stone-500">
                       {item.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-6">
                      <select 
                        value={item.status} 
                        onChange={(e) => updateStatus(item.id!, e.target.value as any)}
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded border-none focus:ring-0 cursor-pointer ${
                          item.status === 'new' ? 'bg-amber-100 text-amber-700' : 
                          item.status === 'replied' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="replied">Replied</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-6 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => setViewingInquiry(item)}
                        className="text-stone-400 hover:text-emerald-600 p-2 transition-colors"
                        title="View Full Inquiry"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => deleteInquiry(item.id!)}
                        className="text-stone-300 hover:text-red-500 p-2 transition-colors"
                        title="Delete Permanently"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'slides' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-serif font-medium">Home Carousel Slides</h3>
             <button 
               onClick={() => setEditingSlide({ title: '', description: '', image: '', accent: 'text-emerald-800' })}
               className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800"
             >
               Add New Slide
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {slides.map(slide => (
               <div key={slide.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden group">
                  <div className="aspect-video relative overflow-hidden bg-stone-100">
                     <img src={slide.image} alt={slide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                     <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => setEditingSlide(slide)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-stone-600 hover:text-emerald-600 shadow-sm"><Package size={16} /></button>
                        <button onClick={() => deleteSlide(slide.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-stone-600 hover:text-red-600 shadow-sm"><X size={16} /></button>
                     </div>
                  </div>
                  <div className="p-4">
                     <h4 className="font-medium text-stone-900 truncate">{slide.title}</h4>
                     <p className="text-xs text-stone-500 mt-1 line-clamp-2">{slide.description}</p>
                  </div>
               </div>
             ))}
             {slides.length === 0 && <div className="col-span-full py-12 text-center text-stone-400 bg-stone-50 rounded-2xl border border-dashed">No slides found. Using defaults.</div>}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm">
           <h3 className="text-2xl font-serif mb-8">Media & Social Link Settings</h3>
           <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">Featured Video URL (YouTube Embed)</label>
                 <input 
                   placeholder="https://www.youtube.com/embed/..." 
                   value={localSettings.videoUrl} 
                   onChange={(e) => setLocalSettings({...localSettings, videoUrl: e.target.value})} 
                   className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none" 
                 />
                 <p className="text-[10px] text-stone-400 italic">Use the "Embed" URL from YouTube for proper display.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2"><Instagram size={14} /> Instagram URL</label>
                   <input 
                     value={localSettings.instagram} 
                     onChange={(e) => setLocalSettings({...localSettings, instagram: e.target.value})} 
                     className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2"><Facebook size={14} /> Facebook URL</label>
                   <input 
                     value={localSettings.facebook} 
                     onChange={(e) => setLocalSettings({...localSettings, facebook: e.target.value})} 
                     className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none" 
                   />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2"><Youtube size={14} /> YouTube Channel URL</label>
                 <input 
                   value={localSettings.youtube} 
                   onChange={(e) => setLocalSettings({...localSettings, youtube: e.target.value})} 
                   className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none" 
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">Website Language</label>
                 <select 
                   id="setting-language"
                   value={localSettings.language || 'en'} 
                   onChange={(e) => setLocalSettings({...localSettings, language: e.target.value})} 
                   className="w-full bg-stone-50 border border-stone-200 p-3 rounded focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                 >
                   <option value="en">English (Global)</option>
                   <option value="id">Indonesia (Local)</option>
                 </select>
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-800 text-white rounded font-medium hover:bg-emerald-900 transition-all mt-6 shadow-lg">
                Save All Settings
              </button>
           </form>
        </div>
      )}

      {/* Slide Edit Modal */}
      <AnimatePresence>
        {editingSlide && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingSlide(null)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl">
              <h3 className="text-2xl font-serif mb-6">{editingSlide.id ? 'Edit Slide' : 'New Slide'}</h3>
              <form onSubmit={handleSaveSlide} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Title</label>
                  <input required value={editingSlide.title} onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} className="w-full bg-stone-50 border border-stone-200 p-3 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Description</label>
                  <textarea rows={3} required value={editingSlide.description} onChange={e => setEditingSlide({...editingSlide, description: e.target.value})} className="w-full bg-stone-50 border border-stone-200 p-3 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Image URL</label>
                  <input required value={editingSlide.image} onChange={e => setEditingSlide({...editingSlide, image: e.target.value})} className="w-full bg-stone-50 border border-stone-200 p-3 rounded" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Accent Style (Tailwind class)</label>
                  <input value={editingSlide.accent} onChange={e => setEditingSlide({...editingSlide, accent: e.target.value})} className="w-full bg-stone-50 border border-stone-200 p-3 rounded" placeholder="text-emerald-800" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-emerald-800 text-white rounded font-medium hover:bg-emerald-900">Save Slide</button>
                  <button type="button" onClick={() => setEditingSlide(null)} className="flex-1 py-3 border border-stone-200 rounded font-medium">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inquiry Detail Modal */}
      <AnimatePresence>
        {viewingInquiry && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingInquiry(null)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded uppercase mb-2">Inquiry Detail</span>
                  <h3 className="text-3xl font-serif text-stone-900">{viewingInquiry.fullName}</h3>
                  <p className="text-stone-500">{viewingInquiry.email}</p>
                </div>
                <button onClick={() => setViewingInquiry(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 border-b border-stone-100 pb-10">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Company</label>
                  <p className="text-stone-900 font-medium">{viewingInquiry.companyName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Interest Type</label>
                  <p className="text-stone-900 font-medium">{viewingInquiry.type}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Received On</label>
                  <p className="text-stone-900 font-medium">{viewingInquiry.createdAt?.toDate().toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Current Status</label>
                  <p className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    viewingInquiry.status === 'new' ? 'bg-amber-100 text-amber-700' : 
                    viewingInquiry.status === 'replied' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {viewingInquiry.status}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase block">Message Content</label>
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{viewingInquiry.message}</p>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <a 
                  href={`mailto:${viewingInquiry.email}?subject=Reply to Inquiry - Yasida Corporation&body=Dear ${viewingInquiry.fullName},%0D%0A%0D%0AThank you for your inquiry about ${viewingInquiry.type}.%0D%0A%0D%0AYour message:%0D%0A"${viewingInquiry.message}"%0D%0A%0D%0A---%0D%0A%0D%0A`}
                  onClick={() => {
                    if (viewingInquiry.status === 'new') {
                      updateStatus(viewingInquiry.id!, 'replied');
                      setViewingInquiry({...viewingInquiry, status: 'replied'});
                    }
                  }}
                  className="flex-1 py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Mail size={20} /> Reply via Email
                </a>
                {viewingInquiry.status === 'new' && (
                  <button 
                    onClick={() => { updateStatus(viewingInquiry.id!, 'replied'); setViewingInquiry({...viewingInquiry, status: 'replied'}); }}
                    className="flex-1 py-4 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-all shadow-lg"
                  >
                    Mark as Replied
                  </button>
                )}
                <button 
                  onClick={() => setViewingInquiry(null)}
                  className="flex-[0.5] py-4 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<any>({
    videoUrl: '',
    instagram: '',
    facebook: '',
    youtube: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const renderPage = () => {
    if (!ready) return <div className="h-screen flex items-center justify-center text-stone-400 font-serif">Nusantara Pepper...</div>;

    const t = translations[(settings.language as 'en' | 'id') || 'en'];

    switch (page) {
      case 'home': return <Home setPage={setPage} settings={settings} t={t} />;
      case 'about': return <About t={t} />;
      case 'products': return <Products t={t} />;
      case 'export': return <ExportProcedure t={t} />;
      case 'sustainability': return <Sustainability t={t} />;
      case 'contact': return <Contact t={t} />;
      case 'admin': return <AdminLogin setPage={setPage} />;
      case 'dashboard': 
        if (user?.email === 'pramukapattimura@gmail.com' || user?.email === 'min8ciamis@gmail.com' || user?.email === 'yasidaifada@gmail.com') return <Dashboard settings={settings} />;
        return <AdminLogin setPage={setPage} />;
      default: return <Home setPage={setPage} settings={settings} t={t} />;
    }
  };

  const t = translations[(settings.language as 'en' | 'id') || 'en'];

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar currentPage={page} setPage={setPage} user={user} t={t} />
      <main>
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>
      <Footer setPage={setPage} settings={settings} t={t} />
    </div>
  );
}
