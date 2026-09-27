import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  ArrowRight,
  Maximize2,
  X,
  ExternalLink,
} from 'lucide-react';

export default function DarkPortfolio() {
  const [selectedExploration, setSelectedExploration] = useState<ExplorationItem | null>(null);

  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-gray-100 selection:text-black relative">
      {/* ========================================================================= */}
      {/* SECTION 3: SELECTED WORKS / FEATURED PROJECTS (LIGHT THEME BENTO GRID) */}
      {/* ========================================================================= */}
      <section id="portfolio-work" className="bg-white py-20 md:py-28 relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-px bg-gray-300" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Selected Work
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
                Featured{' '}
                <span className="font-display italic text-gray-900 font-normal">
                  projects
                </span>
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 max-w-md leading-relaxed">
                A selection of digital experiences, interactive platforms, and design systems crafted from concept to production.
              </p>
            </div>

            <a
              href="#portfolio-explorations"
              className="group hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:border-gray-900 text-xs font-semibold text-gray-800 transition-all shadow-xs hover:shadow-sm"
            >
              <span>View all work</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Bento Grid: Alternate spans 7/5 and 5/7 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {PROJECTS.map((project, idx) => {
              const isCol7 = idx === 0 || idx === 3;
              return (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`group relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-200 shadow-xs hover:shadow-xl transition-all duration-500 h-[380px] md:h-[460px] ${
                    isCol7 ? 'md:col-span-7' : 'md:col-span-5'
                  }`}
                >
                  {/* Background Image */}
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient for base contrast and readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Bottom title info */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-300 drop-shadow-xs">
                        {project.category}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-display italic text-white tracking-wide mt-1 drop-shadow-sm">
                        {project.title}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-white/80">{project.year}</span>
                  </div>

                  {/* Hover Backdrop Overlay with Animated Gradient Pill */}
                  <div className="absolute inset-0 bg-white/85 opacity-0 group-hover:opacity-100 backdrop-blur-md transition-opacity duration-300 flex items-center justify-center p-6 z-20">
                    <div className="relative p-[1.5px] rounded-full overflow-hidden shadow-xl animate-gradient-shift accent-gradient">
                      <div className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span>View —</span>
                        <span className="font-display italic text-base">{project.title}</span>
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: JOURNAL & NOTES (LIGHT THEME HORIZONTAL PILLS) */}
      {/* ========================================================================= */}
      <section id="portfolio-journal" className="bg-[#FBFBFB] py-20 md:py-28 relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-px bg-gray-300" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Journal & Notes
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
                Recent{' '}
                <span className="font-display italic text-gray-900 font-normal">
                  thoughts
                </span>
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 max-w-md leading-relaxed">
                Dispatches on creative direction, generative interfaces, and design theory.
              </p>
            </div>

            <a
              href="#portfolio-journal"
              className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              <span>View all entries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          {/* 4 Journal Entries displayed as sleek horizontal pills */}
          <div className="space-y-4">
            {JOURNAL_ENTRIES.map((entry, idx) => (
              <motion.a
                key={entry.title}
                href="#portfolio-journal"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-[24px] sm:rounded-full bg-white hover:bg-white border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Thumbnail */}
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-100 shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{entry.readTime}</span>
                      <span>•</span>
                      <span>{entry.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:pr-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-white group-hover:bg-black group-hover:border-black transition-all shadow-xs">
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: EXPLORATIONS (LIGHT THEME VISUAL PLAYGROUND) */}
      {/* ========================================================================= */}
      <section id="portfolio-explorations" className="bg-white py-24 relative overflow-hidden border-t border-gray-100">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 text-center relative z-10">
          {/* Header */}
          <div className="mb-16">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
              Explorations
            </span>
            <h2 className="text-4xl md:text-6xl font-light text-gray-900 mt-3 tracking-tight">
              Visual{' '}
              <span className="font-display italic text-gray-900 font-normal">
                playground
              </span>
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-3 max-w-md mx-auto leading-relaxed">
              Experimental 3D canvas textures, procedural shaders, and fluid interactive typography.
            </p>

            <a
              href="https://dribbble.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 text-xs font-medium text-gray-800 transition-all shadow-xs"
            >
              <span>View Dribbble</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Parallax Exploration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {EXPLORATIONS.map((item, idx) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -6, rotate: idx % 2 === 0 ? 0.8 : -0.8 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedExploration(item)}
                className="group relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-200 cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-left z-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold drop-shadow-xs">
                      {item.tag}
                    </span>
                    <h4 className="text-lg font-display italic text-white mt-0.5 drop-shadow-sm">
                      {item.title}
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors shadow-xs">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Lightbox Modal for Explorations */}
        <AnimatePresence>
          {selectedExploration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-overlay">
              <div className="relative max-w-3xl w-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl">
                <button
                  onClick={() => setSelectedExploration(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedExploration.image}
                  alt={selectedExploration.title}
                  className="w-full max-h-[68vh] object-cover"
                />
                <div className="p-6 text-left bg-white">
                  <span className="text-xs uppercase tracking-widest text-sky-600 font-semibold">
                    {selectedExploration.tag}
                  </span>
                  <h3 className="text-2xl font-display italic text-gray-900 mt-1">
                    {selectedExploration.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    High-resolution procedural rendering generated with WebGL shaders and raymarching techniques.
                  </p>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: STATS (LIGHT THEME) */}
      {/* ========================================================================= */}
      <section className="bg-gray-50/70 py-20 border-y border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 text-center md:text-left">
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-200 pb-8 md:pb-0 md:pr-8">
              <h3 className="text-5xl lg:text-6xl font-display italic text-gray-900 tracking-tight">
                20+
              </h3>
              <p className="text-base font-semibold text-gray-900">
                Years Experience
              </p>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
                Two decades crafting digital products, creative systems, and scalable design architectures.
              </p>
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-200 pb-8 md:pb-0 md:pr-8">
              <h3 className="text-5xl lg:text-6xl font-display italic text-gray-900 tracking-tight">
                95+
              </h3>
              <p className="text-base font-semibold text-gray-900">
                Projects Done
              </p>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
                Delivered world-class web applications, 3D simulations, and brand platforms worldwide.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-5xl lg:text-6xl font-display italic text-gray-900 tracking-tight">
                200%
              </h3>
              <p className="text-base font-semibold text-gray-900">
                Satisfied Clients
              </p>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
                Exceeding metric expectations, driving customer satisfaction, and building lasting value.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sample Data
interface ProjectItem {
  title: string;
  category: string;
  year: string;
  image: string;
}

const PROJECTS: ProjectItem[] = [
  {
    title: 'Automotive Motion',
    category: '3D Simulation & WebGL',
    year: '2026',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Urban Architecture',
    category: 'Spatial Design & VR',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Human Perspective',
    category: 'Interactive Installation',
    year: '2025',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Brand Identity',
    category: 'Visual System & Typography',
    year: '2026',
    image:
      'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80',
  },
];

interface JournalItem {
  title: string;
  readTime: string;
  date: string;
  image: string;
}

const JOURNAL_ENTRIES: JournalItem[] = [
  {
    title: 'Engineering Emotional Interfaces in WebGL',
    readTime: '5 min read',
    date: 'Sep 2026',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'The Resurgence of Serifs in Modern Brutalism',
    readTime: '8 min read',
    date: 'Aug 2026',
    image:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Spatial Computing & Reactive Fluid Typography',
    readTime: '4 min read',
    date: 'Jul 2026',
    image:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Designing for Zero Latency: Micro-Interactions',
    readTime: '6 min read',
    date: 'Jun 2026',
    image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
  },
];

interface ExplorationItem {
  title: string;
  tag: string;
  image: string;
}

const EXPLORATIONS: ExplorationItem[] = [
  {
    title: 'Chromatic Distortion',
    tag: 'Shaders',
    image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Kinetic Typography',
    tag: 'Motion',
    image:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Fluid Dynamics',
    tag: 'Simulation',
    image:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Neural Topography',
    tag: 'Generative',
    image:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Neon Glassmorphism',
    tag: '3D Render',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Procedural Geometry',
    tag: 'Compute Shaders',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  },
];
