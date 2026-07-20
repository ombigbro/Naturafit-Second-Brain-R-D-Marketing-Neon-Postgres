'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  PieChart as PieChartIcon,
  Table as TableIcon,
  ExternalLink,
  Lock,
  RefreshCw,
  TrendingUp,
  Coins,
  Layers,
  Activity,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Users,
  Video,
  Play,
  Check,
  Send,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface Product {
  name: string;
  category: string;
  revenue: number;
  avgUnitPrice: number;
  launchDate: string;
  tiktokLink: string;
}

interface Phase1State {
  products: Product[];
  isOfflineMode: boolean;
  processedAt: string;
  totalBpomProducts: number;
  totalRevenue: number;
  categories: string[];
}

interface CompetitorData {
  processedAt: string;
  totalCompetitorRevenue: number;
  affiliators: {
    totalRevenue: number;
    totalReach: number;
    count: number;
    items: Array<{ name: string; followers: number; products: number; revenue: number }>;
    top3: Array<{ name: string; followers: number; products: number; revenue: number }>;
  };
  videos: {
    totalRevenue: number;
    totalViews: number;
    totalLikes: number;
    count: number;
    items: Array<{ title: string; link: string; views: number; likes: number; revenue: number }>;
    top3: Array<{ title: string; link: string; views: number; likes: number; revenue: number }>;
  };
  lives: {
    totalRevenue: number;
    maxPeakViewers: number;
    avgDurationMins: number;
    count: number;
    items: Array<{ title: string; date: string; duration: number; peakViewers: number; revenue: number }>;
    top3: Array<{ title: string; date: string; duration: number; peakViewers: number; revenue: number }>;
  };
}

interface Phase2State {
  sparringSummary: {
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    formulation?: {
      primaryIngredients: string;
      derivativeIngredients: string;
      targetMarket: string;
      topCompetitors: string[];
    };
  };
  competitorData: CompetitorData | null;
  lockedAt: string;
}

interface Phase3State {
  brandName: string;
  visualAesthetic: string;
  image2dUrl: string | null;
  image2dApproved: boolean;
  image3dUrl: string | null;
  image3dApproved: boolean;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  lockedAt?: string | null;
}

interface Slide {
  slideNumber: number;
  title: string;
  subtitle: string;
  content: string[];
}

interface Phase4State {
  slides: Slide[];
  isOfflineMode: boolean;
  compiledAt: string;
}

interface Project {
  id: string;
  name: string;
  admin_id: string;
  createdAt: string;
  admin: {
    email: string;
  };
  phase_1_state: Phase1State | null;
  phase_2_state: Phase2State | null;
  phase_3_state: Phase3State | null;
  phase_4_state: Phase4State | null;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

const PROGRESS_MESSAGES = [
  'Reading Excel file contents...',
  'Parsing e-commerce products...',
  'Verifying BPOM TR/MD certifications...',
  'Filtering out cosmetics and non-BPOM items...',
  'Running AI semantic cleaning pipeline...',
  'Consolidating duplicate brand items...',
  'Aggregating 30-day market revenues...',
  'Saving project analytics state...'
];

const COMPETITOR_PROGRESS_MESSAGES = [
  'Reading competitor spreadsheet...',
  'Locating Affiliators, Videos, and Live Sessions sheets...',
  'Parsing creator reach metrics...',
  'Extracting video view engagement...',
  'Aggregating live session streams...',
  'Calculating competitor sales shares...',
  'Saving competitor dashboard stats...'
];

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Phase Tabs
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2' | 'phase3' | 'phase4'>('phase1');

  // Errors and notices
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Hydration fix for Recharts
  const [isMounted, setIsMounted] = useState(false);

  // Phase 1 specific states
  const [uploading, setUploading] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 2 specific states
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi! I am your Strategic Sparring partner. I have parsed your Phase 1 data. Ask me to "Recommend ingredients" or "Suggest target market" based on our categories, or let\'s challenge your brand positioning!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [competitorUploading, setCompetitorUploading] = useState(false);
  const [competitorProgressIdx, setCompetitorProgressIdx] = useState(0);
  const [competitorDragActive, setCompetitorDragActive] = useState(false);
  const competitorFileInputRef = useRef<HTMLInputElement>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);
  const [competitorTab, setCompetitorTab] = useState<'affiliators' | 'videos' | 'lives'>('affiliators');
  
  // Formulation lock form states
  const [primaryIngredients, setPrimaryIngredients] = useState('');
  const [derivativeIngredients, setDerivativeIngredients] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [topCompetitors, setTopCompetitors] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Phase 3 specific states
  const [brandName, setBrandName] = useState('');
  const [visualAesthetic, setVisualAesthetic] = useState('');
  const [image2dUrl, setImage2dUrl] = useState<string | null>(null);
  const [image2dApproved, setImage2dApproved] = useState(false);
  const [image3dUrl, setImage3dUrl] = useState<string | null>(null);
  const [image3dApproved, setImage3dApproved] = useState(false);
  const [phase3ChatInput, setPhase3ChatInput] = useState('');
  const [phase3ChatMessages, setPhase3ChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hello! I am your Brand Book & Visual Brainstorming partner. Based on your locked Phase 2 strategy, let's brainstorm some creative brand names and packaging aesthetics. Ask me to \"Brainstorm name options\" or \"Suggest visual concepts\" to get started!" }
  ]);
  const [phase3ChatLoading, setPhase3ChatLoading] = useState(false);
  const [image2dLoading, setImage2dLoading] = useState(false);
  const [image3dLoading, setImage3dLoading] = useState(false);
  const phase3ChatBottomRef = useRef<HTMLDivElement>(null);

  // Phase 4 states
  const [phase4Compiling, setPhase4Compiling] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchProject = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        
        // Restore Phase 3 states if present
        if (data.project.phase_3_state) {
          const p3 = data.project.phase_3_state;
          setBrandName(p3.brandName || '');
          setVisualAesthetic(p3.visualAesthetic || '');
          setImage2dUrl(p3.image2dUrl || null);
          setImage2dApproved(p3.image2dApproved || false);
          setImage3dUrl(p3.image3dUrl || null);
          setImage3dApproved(p3.image3dApproved || false);
          if (p3.chatHistory) {
            setPhase3ChatMessages(p3.chatHistory);
          }
        } else if (data.project.phase_2_state) {
          const p2 = data.project.phase_2_state;
          const primary = p2.sparringSummary?.formulation?.primaryIngredients || '';
          if (primary.toLowerCase().includes('psyllium') || primary.toLowerCase().includes('slim') || primary.toLowerCase().includes('diet')) {
            setBrandName('RimFit');
            setVisualAesthetic('Botanical Green & Gold Elegance. Forest green packaging with golden plant line-art.');
          } else if (primary.toLowerCase().includes('collagen') || primary.toLowerCase().includes('glutathione') || primary.toLowerCase().includes('skin')) {
            setBrandName('GlowVita');
            setVisualAesthetic('Minimalist Pastel Pink & Rose Gold. Sleek typography with delicate waves.');
          } else {
            setBrandName('Jamu Jaga');
            setVisualAesthetic('Warm Earthy Terracotta. Traditional amber styling with hand-drawn organic outlines.');
          }
        }

        // Restore Phase 2 states if present
        if (data.project.phase_2_state) {
          const p2 = data.project.phase_2_state;
          if (p2.sparringSummary?.chatHistory) {
            setMessages(p2.sparringSummary.chatHistory);
          }
          if (p2.competitorData) {
            setCompetitorData(p2.competitorData);
          }
          if (p2.sparringSummary?.formulation) {
            const form = p2.sparringSummary.formulation;
            setPrimaryIngredients(form.primaryIngredients || '');
            setDerivativeIngredients(form.derivativeIngredients || '');
            setTargetMarket(form.targetMarket || '');
            setTopCompetitors(form.topCompetitors ? form.topCompetitors.join(', ') : '');
          }
        } else if (data.project.phase_1_state) {
          // Pre-fill defaults based on first category
          const categories = data.project.phase_1_state.categories || [];
          const mainCat = categories[0] || 'Weight Loss';
          if (mainCat.toLowerCase().includes('slim') || mainCat.toLowerCase().includes('weight')) {
            setPrimaryIngredients('Psyllium Husk, Green Tea Extract');
            setDerivativeIngredients('Inulin, Garcinia Cambogia, Vitamin C');
            setTargetMarket('Urban professionals aged 22-38 looking for healthy detox');
            setTopCompetitors('Flimty, Slimming Tea Mustika Ratu, Noera');
          } else if (mainCat.toLowerCase().includes('skin') || mainCat.toLowerCase().includes('collagen')) {
            setPrimaryIngredients('Marine Collagen Peptides, L-Glutathione');
            setDerivativeIngredients('Vitamin C, Hyaluronic Acid, Beetroot Extract');
            setTargetMarket('Young females aged 18-35 focusing on premium skin health');
            setTopCompetitors('Cool-vita Collagen, Noera Collagen Drink, Byoote');
          } else {
            setPrimaryIngredients('Ginger Extract, Curcuma (Temulawak)');
            setDerivativeIngredients('Honey Extract, Royal Jelly, Zinc');
            setTargetMarket('Adults seeking natural wellness and immunity booster');
            setTopCompetitors('Jamu Sido Muncul, Herbilogy, Madu TJ');
          }
        }
      } else {
        setError('Failed to fetch project details.');
      }
    } catch {
      setError('An error occurred while loading project workspace.');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Set active tab based on project progression
  useEffect(() => {
    if (project) {
      if (project.phase_3_state) {
        setActiveTab('phase3'); // Default to phase 3 if brand book exists
      } else if (project.phase_2_state) {
        setActiveTab('phase3'); // Default to phase 3 if phase 2 strategy is locked
      } else if (project.phase_1_state) {
        setActiveTab('phase2'); // Default to phase 2 if phase 1 data is uploaded
      } else {
        setActiveTab('phase1'); // Default to phase 1
      }
    }
  }, [project]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Auto-scroll Phase 3 chat to bottom
  useEffect(() => {
    phase3ChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase3ChatMessages, phase3ChatLoading]);

  // Loading progress message rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploading) {
      interval = setInterval(() => {
        setProgressIdx((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
      }, 1800);
    } else {
      setProgressIdx(0);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (competitorUploading) {
      interval = setInterval(() => {
        setCompetitorProgressIdx((prev) => (prev + 1) % COMPETITOR_PROGRESS_MESSAGES.length);
      }, 1800);
    } else {
      setCompetitorProgressIdx(0);
    }
    return () => clearInterval(interval);
  }, [competitorUploading]);

  // File Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setError('Invalid file format. Only XLSX, XLS, and CSV files are accepted.');
      return;
    }

    setUploading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase1`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_1_state: data.state };
        });
        if (data.state.isOfflineMode) {
          setNotice('OpenAI API Key not configured. Pipeline executed in simulation mode.');
        }
        setActiveTab('phase2');
      } else {
        setError(data.error || 'Failed to process data file.');
      }
    } catch {
      setError('An error occurred during file upload & processing.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetPhase1 = async () => {
    if (!window.confirm('Are you sure you want to reset Phase 1? This will clear all parsed data.')) {
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase1`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_1_state: null, phase_2_state: null };
        });
        setCompetitorData(null);
        setActiveTab('phase1');
      } else {
        setError('Failed to reset Phase 1 state.');
      }
    } catch {
      setError('An error occurred while resetting Phase 1.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 2 Competitors dropzone & parser
  const handleCompetitorDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setCompetitorDragActive(true);
    } else if (e.type === 'dragleave') {
      setCompetitorDragActive(false);
    }
  };

  const handleCompetitorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompetitorDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCompetitorFile(e.dataTransfer.files[0]);
    }
  };

  const handleCompetitorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCompetitorFile(e.target.files[0]);
    }
  };

  const processCompetitorFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setError('Invalid competitor file format. Only XLSX, XLS, and CSV files are accepted.');
      return;
    }

    setCompetitorUploading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase2/competitors`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompetitorData(data.summary);
      } else {
        setError(data.error || 'Failed to process competitor data file.');
      }
    } catch {
      setError('An error occurred during competitor file processing.');
    } finally {
      setCompetitorUploading(false);
    }
  };

  // Phase 2 Strategic chat handler
  const handleSendChat = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    if (!customMessage) {
      setChatInput('');
    }

    const updatedMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(updatedMessages);
    setChatLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase2/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
        if (data.isOfflineMode && !notice) {
          setNotice('Executing sparring chat in simulation mode (API Key not configured).');
        }
      } else {
        setError(data.error || 'Failed to fetch AI response.');
      }
    } catch {
      setError('An error occurred while sending message.');
    } finally {
      setChatLoading(false);
    }
  };

  // Lock Phase 2 strategy
  const handleLockStrategy = async () => {
    if (!primaryIngredients.trim() || !derivativeIngredients.trim() || !targetMarket.trim()) {
      alert('Please fill out the formulation formulation settings (primary and derivative ingredients, target market) before locking.');
      return;
    }

    setLoading(true);
    setError(null);

    const locks = {
      sparringSummary: {
        chatHistory: messages,
        formulation: {
          primaryIngredients,
          derivativeIngredients,
          targetMarket,
          topCompetitors: topCompetitors.split(',').map(s => s.trim()).filter(Boolean)
        }
      },
      competitorData: competitorData
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/phase2/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locks),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_2_state: data.state };
        });
        setActiveTab('phase3');
      } else {
        setError(data.error || 'Failed to lock strategy state.');
      }
    } catch {
      setError('An error occurred while locking strategy.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPhase2 = async () => {
    if (!window.confirm('Are you sure you want to reset Phase 2? This will clear locked formulations and competitor files.')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase2`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_2_state: null };
        });
        setCompetitorData(null);
        setMessages([
          { role: 'assistant', content: 'Hi! I am your Strategic Sparring partner. I have parsed your Phase 1 data. Ask me to "Recommend ingredients" or "Suggest target market" based on our categories, or let\'s challenge your brand positioning!' }
        ]);
        setActiveTab('phase2');
      } else {
        setError('Failed to reset Phase 2 state.');
      }
    } catch {
      setError('An error occurred while resetting Phase 2.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 3 Chat handler
  const handleSendPhase3Chat = async (customMessage?: string) => {
    const textToSend = customMessage || phase3ChatInput;
    if (!textToSend.trim() || phase3ChatLoading) return;

    if (!customMessage) {
      setPhase3ChatInput('');
    }

    const updatedMessages = [...phase3ChatMessages, { role: 'user' as const, content: textToSend }];
    setPhase3ChatMessages(updatedMessages);
    setPhase3ChatLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase3/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPhase3ChatMessages((prev) => [...prev, data.message]);
        if (data.isOfflineMode && !notice) {
          setNotice('Executing brand naming chat in simulation mode (API Key not configured).');
        }
      } else {
        setError(data.error || 'Failed to fetch AI response.');
      }
    } catch {
      setError('An error occurred while sending message.');
    } finally {
      setPhase3ChatLoading(false);
    }
  };

  // Phase 3 Image Generation handler
  const handleGenerateImage = async (type: '2d' | '3d') => {
    if (!brandName.trim()) {
      alert('Please enter a Brand Name before generating assets.');
      return;
    }
    if (!visualAesthetic.trim()) {
      alert('Please fill out the Visual Aesthetic & Style parameters before generating assets.');
      return;
    }

    if (type === '2d') {
      setImage2dLoading(true);
    } else {
      setImage3dLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase3/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          brandName,
          visualAesthetic
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (type === '2d') {
          setImage2dUrl(data.url);
          setImage2dApproved(false); // require explicit approval click
        } else {
          setImage3dUrl(data.url);
          setImage3dApproved(false);
        }
        if (data.isOfflineMode && !notice) {
          setNotice('Image generated in simulation mode (AI Image Key not configured).');
        }
      } else {
        setError(data.error || `Failed to generate ${type} layout.`);
      }
    } catch {
      setError(`An error occurred during ${type} layout generation.`);
    } finally {
      if (type === '2d') {
        setImage2dLoading(false);
      } else {
        setImage3dLoading(false);
      }
    }
  };

  // Lock Phase 3 Brand book state
  const handleLockBrandBook = async () => {
    if (!brandName.trim() || !visualAesthetic.trim() || !image2dUrl || !image3dUrl) {
      alert('Brand Name, Visual Aesthetic, and approved 2D/3D assets are required before locking.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          visualAesthetic,
          image2dUrl,
          image3dUrl,
          chatHistory: phase3ChatMessages
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_3_state: data.state };
        });
        setActiveTab('phase3'); // Stay on Phase 3
      } else {
        setError(data.error || 'Failed to lock brand book.');
      }
    } catch {
      setError('An error occurred while locking brand book.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Phase 3 state
  const handleResetPhase3 = async () => {
    if (!window.confirm('Are you sure you want to unlock Phase 3? This will allow edits, but you will need to re-approve assets.')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/phase3`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_3_state: null };
        });
        setImage2dApproved(false);
        setImage3dApproved(false);
      } else {
        setError('Failed to reset Phase 3 state.');
      }
    } catch {
      setError('An error occurred while resetting Phase 3.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompilePhase4 = async () => {
    setError(null);
    setPhase4Compiling(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/phase4/compile`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_4_state: data.state };
        });
        setSelectedSlideIndex(0);
      } else {
        setError(data.error || 'Failed to compile Pitch Deck.');
      }
    } catch {
      setError('An error occurred during Pitch Deck compilation.');
    } finally {
      setPhase4Compiling(false);
    }
  };

  const handleResetPhase4 = async () => {
    if (!window.confirm('Are you sure you want to unlock the Pitch Deck? This will clear the compiled slides, but your Phase 1, 2, and 3 selections will remain safe.')) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/phase4`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, phase_4_state: null };
        });
      } else {
        setError('Failed to unlock Pitch Deck.');
      }
    } catch {
      setError('An error occurred while resetting Phase 4 state.');
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (num: number) => {
    if (num >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(2).replace('.', ',')} B`;
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
        <span className="font-semibold text-sm">Loading workspace dashboard...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 glass-panel rounded-2xl text-center border border-white/5">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Project Not Found</h3>
        <p className="text-zinc-400 text-sm mb-6">
          The requested project workspace could not be located or you do not have permission to access it.
        </p>
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold text-zinc-200 mx-auto hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  const phase1 = project.phase_1_state;
  const phase2 = project.phase_2_state;

  // Process data for charts (Phase 1)
  let revenueChartData: { name: string; value: number }[] = [];
  let countChartData: { name: string; value: number }[] = [];

  if (phase1 && phase1.products) {
    const revMap: { [key: string]: number } = {};
    const countMap: { [key: string]: number } = {};

    phase1.products.forEach((p) => {
      revMap[p.category] = (revMap[p.category] || 0) + p.revenue;
      countMap[p.category] = (countMap[p.category] || 0) + 1;
    });

    revenueChartData = Object.keys(revMap).map((cat) => ({
      name: cat,
      value: revMap[cat],
    }));

    countChartData = Object.keys(countMap).map((cat) => ({
      name: cat,
      value: countMap[cat],
    }));
  }

  const filteredProducts = phase1?.products.filter(
    (p) => selectedCategory === 'All Categories' || p.category === selectedCategory
  ) || [];

  const top10Products = filteredProducts.slice(0, 10);
  const selectedCategoryTotalRevenue = filteredProducts.reduce((sum, p) => sum + p.revenue, 0);

  const topCategory = revenueChartData.length > 0
    ? [...revenueChartData].sort((a, b) => b.value - a.value)[0].name
    : 'None';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full flex flex-col justify-start">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-6 mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/projects')}
            className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Back to projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-400">Project Workspace</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full font-medium">Owner: {project.admin.email}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">{project.name}</h1>
          </div>
        </div>

        {/* Phase navigation tabs */}
        <div className="flex items-center space-x-1.5 text-xs bg-zinc-950/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('phase1')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
              activeTab === 'phase1'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Phase 1: Ingestion</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-zinc-700 font-bold" />

          <button
            onClick={() => {
              if (phase1) setActiveTab('phase2');
            }}
            disabled={!phase1}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'phase2'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : phase1
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span>Phase 2: Sparring</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-zinc-700 font-bold" />

          <button
            onClick={() => {
              if (phase2) setActiveTab('phase3');
            }}
            disabled={!phase2}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'phase3'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : phase2
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span>Phase 3: Branding</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-zinc-700 font-bold" />

          <button
            onClick={() => {
              if (project?.phase_3_state) setActiveTab('phase4');
            }}
            disabled={!project?.phase_3_state}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'phase4'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : project?.phase_3_state
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span>Phase 4: Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm mb-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Error Encountered</h4>
            <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl text-sm mb-6 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">System Notice</h4>
            <p className="text-xs text-yellow-400/90 mt-0.5">{notice}</p>
          </div>
        </div>
      )}

      {/* PHASE 1 CONTAINER */}
      {activeTab === 'phase1' && (
        <div>
          {!phase1 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-8">
              {uploading ? (
                <div className="glass-panel p-12 rounded-3xl border border-white/5 w-full text-center flex flex-col items-center justify-center min-h-[350px]">
                  <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Analyzing E-Commerce Dataset</h3>
                  <div className="h-2 w-48 bg-zinc-900 rounded-full overflow-hidden mb-4 mx-auto border border-white/5">
                    <div className="h-full bg-gradient-purple animate-pulse w-3/4 rounded-full" />
                  </div>
                  <p className="text-purple-400 font-semibold text-sm tracking-wide animate-pulse">
                    {PROGRESS_MESSAGES[progressIdx]}
                  </p>
                  <p className="text-zinc-500 text-xs mt-6 max-w-md leading-relaxed">
                    Our AI agent is matching columns, cleaning names, filtering certified products, and grouping records. This might take up to a minute depending on file size.
                  </p>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`glass-panel p-12 rounded-3xl border-2 border-dashed w-full text-center flex flex-col items-center justify-center min-h-[350px] transition-all cursor-pointer ${
                    dragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2">Upload Kalodata Raw File</h3>
                  <p className="text-zinc-400 text-sm mb-4 max-w-lg leading-relaxed">
                    Drag and drop your e-commerce product export (supports XLSX, XLS, or CSV). The pipeline automatically extracts key parameters and runs AI filtration.
                  </p>
                  <div className="mb-8" onClick={(e) => e.stopPropagation()}>
                    <a
                      href="/Kalodata_Template.xlsx"
                      download="Kalodata_Template.xlsx"
                      className="inline-flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold underline decoration-dotted transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Download Sample Kalodata Template</span>
                    </a>
                  </div>

                  <div className="flex flex-col items-center gap-4 bg-zinc-950/50 border border-white/5 rounded-2xl p-6 w-full max-w-lg text-left">
                    <div className="flex items-center space-x-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span>Required Schema Mapping</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                        <span className="text-zinc-200 font-semibold">Product Name</span>
                        <span className="text-zinc-500 text-[10px]">(Text)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                        <span className="text-zinc-200 font-semibold">Launch Date</span>
                        <span className="text-zinc-500 text-[10px]">(Date)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                        <span className="text-zinc-200 font-semibold">Avg Unit Price</span>
                        <span className="text-zinc-500 text-[10px]">(Number)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                        <span className="text-zinc-200 font-semibold">30-day Revenue</span>
                        <span className="text-zinc-500 text-[10px]">(Number)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Dashboard Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Total Cleaned Revenue</span>
                    <span className="text-xl font-bold text-white mt-1 block">{formatIDR(phase1.totalRevenue)}</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">BPOM TR/MD Products</span>
                    <span className="text-xl font-bold text-white mt-1 block">{phase1.totalBpomProducts} Products</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Category Claims Count</span>
                    <span className="text-xl font-bold text-white mt-1 block">{phase1.categories.length} Categories</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Top Performing Claim</span>
                    <span className="text-xl font-bold text-purple-400 truncate max-w-[150px] mt-1 block" title={topCategory}>
                      {topCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Panel and Standouts Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col">
                    <div className="flex items-center space-x-2 mb-4">
                      <PieChartIcon className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">Revenue by Category Claim</h3>
                    </div>
                    <div className="h-64 w-full relative">
                      {isMounted && revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={revenueChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {revenueChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: '#09090b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                              formatter={(value: number) => [formatIDR(value), 'Revenue']}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconSize={8}
                              iconType="circle"
                              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                          No chart data available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col">
                    <div className="flex items-center space-x-2 mb-4">
                      <Layers className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">Product Count by Claim</h3>
                    </div>
                    <div className="h-64 w-full relative">
                      {isMounted && countChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={countChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {countChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: '#09090b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                              formatter={(value: number) => [`${value} Products`, 'Count']}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconSize={8}
                              iconType="circle"
                              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                          No chart data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/5 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-3">
                    <div className="flex items-center space-x-2">
                      <TableIcon className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">Top 10 Category Standouts</h3>
                    </div>

                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="form-input px-3 py-1.5 pr-8 text-xs font-semibold bg-zinc-900 border border-white/5 text-zinc-300 rounded-lg outline-none cursor-pointer focus:border-purple-500"
                      >
                        <option value="All Categories">All Categories ({phase1.products.length})</option>
                        {phase1.categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} ({phase1.products.filter(p => p.category === cat).length})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-2 text-center w-8">#</th>
                          <th className="py-3 px-3">Product Name</th>
                          <th className="py-3 px-2 text-right">Avg Price</th>
                          <th className="py-3 px-2 text-right">Est. Volume</th>
                          <th className="py-3 px-3 text-right">30d Revenue</th>
                          <th className="py-3 px-2 text-center w-12">Shop</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top10Products.map((p, index) => {
                          const estVolume = p.avgUnitPrice > 0 ? Math.round(p.revenue / p.avgUnitPrice) : 0;
                          return (
                            <tr
                              key={p.name + index}
                              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 px-2 text-center text-zinc-500 font-bold">{index + 1}</td>
                              <td className="py-3 px-3 font-semibold text-white group cursor-default">
                                <span className="line-clamp-1" title={p.name}>
                                  {p.name}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right text-zinc-300 font-medium">
                                {p.avgUnitPrice > 0 ? formatIDR(p.avgUnitPrice) : 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-right text-zinc-400 font-medium">
                                {estVolume > 0 ? estVolume.toLocaleString('id-ID') : 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-right text-purple-400 font-bold">
                                {formatIDR(p.revenue)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <a
                                  href={p.tiktokLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white transition-all border border-purple-500/25"
                                  title="Search TikTok Shop"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </td>
                            </tr>
                          );
                        })}

                        {top10Products.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500">
                              No items match the filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {top10Products.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-2 text-zinc-400">
                        <span title="Aggregated sum of all detected BPOM products in this claim category">
                          <HelpCircle className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-xs text-zinc-400">Total Category Market Size:</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-purple tracking-tight">
                          {formatIDR(selectedCategoryTotalRevenue)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 gap-4">
                <button
                  onClick={handleResetPhase1}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset & Re-upload Data</span>
                </button>

                <button
                  onClick={() => setActiveTab('phase2')}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-purple text-white hover:shadow-purple-500/20 shadow-lg font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Lock Phase 1 & Start Strategic Sparring</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2 CONTAINER */}
      {activeTab === 'phase2' && phase1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT COLUMN: STRATEGIC SPAR DEBATE CHAT */}
            <div className="lg:col-span-5 flex flex-col glass-card rounded-2xl border border-white/5 overflow-hidden h-[600px]">
              <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Strategic AI Sparring</h3>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Persona Active</span>
                </div>
              </div>

              {/* Chat Message list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {m.role === 'assistant' && (
                        <div className="flex items-center space-x-1 text-purple-400 font-extrabold tracking-wider uppercase text-[9px] mb-1.5">
                          <Sparkles className="h-3 w-3" />
                          <span>Sparring AI</span>
                        </div>
                      )}
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-white/5 text-zinc-400 rounded-2xl rounded-bl-none p-4 text-xs flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                      <span>AI is exploring market gaps & regulations...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick suggestion prompt tags */}
              <div className="p-3 border-t border-white/5 bg-zinc-950/20 flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendChat('Recommend ingredients formulation')}
                  disabled={chatLoading}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[10px] font-semibold rounded-lg transition-all"
                >
                  Suggest Ingredients
                </button>
                <button
                  onClick={() => handleSendChat('Analyze target market & demographics')}
                  disabled={chatLoading}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[10px] font-semibold rounded-lg transition-all"
                >
                  Analyze Target Market
                </button>
                <button
                  onClick={() => handleSendChat('Recommend top 3 competitors to upload')}
                  disabled={chatLoading}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[10px] font-semibold rounded-lg transition-all"
                >
                  Recommend Competitors
                </button>
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="p-3 bg-zinc-950/60 border-t border-white/5 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Challenge ingredient formulas, price ranges, or ask details..."
                  className="flex-1 form-input px-3 py-2.5 text-xs bg-zinc-900 border border-white/5 text-white outline-none rounded-xl"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: COMPETITOR INGESTION & VISUALS */}
            <div className="lg:col-span-7 flex flex-col h-[600px]">
              {!competitorData ? (
                // Dropzone for Competitor Excel Ingestion
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                  {competitorUploading ? (
                    <div className="glass-panel p-12 rounded-3xl border border-white/5 w-full text-center flex flex-col items-center justify-center min-h-[350px]">
                      <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-6" />
                      <h3 className="text-2xl font-bold text-white mb-2">Ingesting Competitor Data</h3>
                      <div className="h-2 w-48 bg-zinc-900 rounded-full overflow-hidden mb-4 mx-auto border border-white/5">
                        <div className="h-full bg-gradient-purple animate-pulse w-3/4 rounded-full" />
                      </div>
                      <p className="text-purple-400 font-semibold text-sm tracking-wide animate-pulse">
                        {COMPETITOR_PROGRESS_MESSAGES[competitorProgressIdx]}
                      </p>
                      <p className="text-zinc-500 text-xs mt-6 max-w-md leading-relaxed">
                        Parsing Affiliators lists, aggregating Video views, and checking Live Session duration details.
                      </p>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleCompetitorDrag}
                      onDragOver={handleCompetitorDrag}
                      onDragLeave={handleCompetitorDrag}
                      onDrop={handleCompetitorDrop}
                      className={`glass-panel p-10 rounded-3xl border-2 border-dashed w-full text-center flex flex-col items-center justify-center min-h-[350px] transition-all cursor-pointer ${
                        competitorDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => competitorFileInputRef.current?.click()}
                    >
                      <input
                        ref={competitorFileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleCompetitorFileChange}
                      />
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                        <Upload className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1.5">Ingest 3-Sheet Competitor File</h3>
                      <p className="text-zinc-400 text-xs mb-4 max-w-md leading-relaxed">
                        Upload e-commerce competitor spreadsheet. Excel sheet MUST contain three specific sheets: **Affiliators**, **Videos**, and **Live Sessions**.
                      </p>
                      <div className="mb-6" onClick={(e) => e.stopPropagation()}>
                        <a
                          href="/Competitor_Template.xlsx"
                          download="Competitor_Template.xlsx"
                          className="inline-flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold underline decoration-dotted transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Download Competitor Spreadsheet Template</span>
                        </a>
                      </div>

                      <div className="flex flex-col items-center gap-3 bg-zinc-950/50 border border-white/5 rounded-2xl p-4 w-full max-w-md text-left">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          <Layers className="h-3.5 w-3.5 text-purple-400" />
                          <span>Required Multi-Sheet Headers</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[11px] text-zinc-300">
                          <div>• **Affiliators**: Name, Followers, Products, Revenue</div>
                          <div>• **Videos**: Title, Link, Views, Likes, Revenue</div>
                          <div>• **Live Sessions**: Title, Date, Duration, Peak Viewers, Revenue</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Competitor Analysis Dashboard
                <div className="flex-1 flex flex-col glass-card rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Competitor Analysis Dashboard</h3>
                    </div>
                    <button
                      onClick={() => setCompetitorData(null)}
                      className="flex items-center space-x-1 text-[10px] text-zinc-400 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all font-semibold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Re-upload</span>
                    </button>
                  </div>

                  {/* Summary Stats Row */}
                  <div className="grid grid-cols-3 border-b border-white/5 bg-zinc-950/20 text-center">
                    <div className="p-4 border-r border-white/5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Competitor Sales</span>
                      <span className="text-sm font-extrabold text-purple-400 mt-1 block">{formatIDR(competitorData.totalCompetitorRevenue)}</span>
                    </div>
                    <div className="p-4 border-r border-white/5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Creators Reach</span>
                      <span className="text-sm font-extrabold text-white mt-1 block">{(competitorData.affiliators?.totalReach || 0).toLocaleString('id-ID')} Reach</span>
                    </div>
                    <div className="p-4">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Video Impact</span>
                      <span className="text-sm font-extrabold text-white mt-1 block">{(competitorData.videos?.totalViews || 0).toLocaleString('id-ID')} Views</span>
                    </div>
                  </div>

                  {/* Tab Selector inside dashboard */}
                  <div className="flex border-b border-white/5 bg-zinc-950/10 text-xs">
                    <button
                      onClick={() => setCompetitorTab('affiliators')}
                      className={`flex-1 py-3 font-semibold border-b-2 text-center transition-all ${
                        competitorTab === 'affiliators'
                          ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Creators ({competitorData.affiliators?.count || 0})
                    </button>
                    <button
                      onClick={() => setCompetitorTab('videos')}
                      className={`flex-1 py-3 font-semibold border-b-2 text-center transition-all ${
                        competitorTab === 'videos'
                          ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Viral Videos ({competitorData.videos?.count || 0})
                    </button>
                    <button
                      onClick={() => setCompetitorTab('lives')}
                      className={`flex-1 py-3 font-semibold border-b-2 text-center transition-all ${
                        competitorTab === 'lives'
                          ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Live Sessions ({competitorData.lives?.count || 0})
                    </button>
                  </div>

                  {/* Competitor data details content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {competitorTab === 'affiliators' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-purple-400" />
                          <span>Top Affiliates & Creator Share</span>
                        </h4>

                        {/* Top Creators Share Visualization */}
                        <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-xl mb-4 space-y-3">
                          <h5 className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Top Creator Revenue Distribution</h5>
                          <div className="space-y-2">
                            {competitorData.affiliators.items.slice(0, 5).map((item, idx) => {
                              const percentage = competitorData.affiliators.totalRevenue > 0 
                                ? (item.revenue / competitorData.affiliators.totalRevenue) * 100 
                                : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-semibold text-zinc-200">@{item.name}</span>
                                    <span className="text-purple-400 font-bold">{percentage.toFixed(1)}% ({formatIDR(item.revenue)})</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      style={{ width: `${percentage}%` }} 
                                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                              <th className="py-2 px-1 w-8 text-center">#</th>
                              <th className="py-2 px-2">Creator Name</th>
                              <th className="py-2 px-2 text-right">Followers</th>
                              <th className="py-2 px-2 text-center">Products</th>
                              <th className="py-2 px-2 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitorData.affiliators.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01]">
                                <td className="py-2.5 px-1 text-center font-bold text-zinc-500">{idx + 1}</td>
                                <td className="py-2.5 px-2 font-semibold text-white">{item.name}</td>
                                <td className="py-2.5 px-2 text-right text-zinc-300">{item.followers.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-2 text-center text-zinc-400">{item.products}</td>
                                <td className="py-2.5 px-2 text-right text-purple-400 font-bold">{formatIDR(item.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {competitorTab === 'videos' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <Video className="h-3.5 w-3.5 text-purple-400" />
                          <span>Top Competitor Videos</span>
                        </h4>

                        {/* Top Videos Revenue Visualization */}
                        <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-xl mb-4 space-y-3">
                          <h5 className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Top Viral Video Revenue Impact</h5>
                          <div className="space-y-2">
                            {competitorData.videos.items.slice(0, 5).map((item, idx) => {
                              const percentage = competitorData.videos.totalRevenue > 0 
                                ? (item.revenue / competitorData.videos.totalRevenue) * 100 
                                : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-semibold text-zinc-200 truncate max-w-[200px]" title={item.title}>{item.title}</span>
                                    <span className="text-purple-400 font-bold">{percentage.toFixed(1)}% ({formatIDR(item.revenue)})</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      style={{ width: `${percentage}%` }} 
                                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {competitorData.videos.items.map((item, idx) => (
                            <div key={idx} className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:border-purple-500/20 transition-all">
                              <div className="space-y-1 max-w-[70%]">
                                <p className="font-semibold text-white line-clamp-1" title={item.title}>{item.title}</p>
                                <div className="flex items-center space-x-3 text-[10px] text-zinc-400">
                                  <span>{item.views.toLocaleString('id-ID')} views</span>
                                  <span>•</span>
                                  <span>{item.likes.toLocaleString('id-ID')} likes</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 text-right">
                                <div>
                                  <span className="font-bold text-purple-400 block">{formatIDR(item.revenue)}</span>
                                </div>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-white/5 border border-white/5 hover:bg-purple-600 rounded-lg text-zinc-300 hover:text-white transition-all"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {competitorTab === 'lives' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <Play className="h-3.5 w-3.5 text-purple-400" />
                          <span>Competitor Live Streams</span>
                        </h4>

                        {/* Top Livestreams Revenue Visualization */}
                        <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-xl mb-4 space-y-3">
                          <h5 className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Top Live Stream Session Shares</h5>
                          <div className="space-y-2">
                            {competitorData.lives.items.slice(0, 5).map((item, idx) => {
                              const percentage = competitorData.lives.totalRevenue > 0 
                                ? (item.revenue / competitorData.lives.totalRevenue) * 100 
                                : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-semibold text-zinc-200 truncate max-w-[200px]" title={item.title}>{item.title} ({item.duration}m)</span>
                                    <span className="text-purple-400 font-bold">{percentage.toFixed(1)}% ({formatIDR(item.revenue)})</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      style={{ width: `${percentage}%` }} 
                                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                              <th className="py-2 px-1 w-8 text-center">#</th>
                              <th className="py-2 px-2">Live Session</th>
                              <th className="py-2 px-2 text-center">Duration</th>
                              <th className="py-2 px-2 text-right">Peak Viewers</th>
                              <th className="py-2 px-2 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitorData.lives.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01]">
                                <td className="py-2.5 px-1 text-center font-bold text-zinc-500">{idx + 1}</td>
                                <td className="py-2.5 px-2">
                                  <span className="font-semibold text-white block line-clamp-1" title={item.title}>{item.title}</span>
                                  <span className="text-[9px] text-zinc-500 block">{item.date}</span>
                                </td>
                                <td className="py-2.5 px-2 text-center text-zinc-300">{item.duration}m</td>
                                <td className="py-2.5 px-2 text-right text-zinc-300">{item.peakViewers.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-2 text-right text-purple-400 font-bold">{formatIDR(item.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* LOWER SECTION: LOCKED FORMULATION STATE / LOCK MECHANISM */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Lock className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Strategic Formulation Parameters</h3>
            </div>

            {!phase2 ? (
              // EDITABLE INPUT STATE
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Primary Ingredients</label>
                    <input
                      type="text"
                      value={primaryIngredients}
                      onChange={(e) => setPrimaryIngredients(e.target.value)}
                      placeholder="e.g. Psyllium Husk, Green Tea Extract (comma separated)"
                      className="w-full form-input px-3.5 py-2.5 bg-zinc-900 border border-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Derivative Ingredients</label>
                    <input
                      type="text"
                      value={derivativeIngredients}
                      onChange={(e) => setDerivativeIngredients(e.target.value)}
                      placeholder="e.g. Inulin, Garcinia Cambogia, Vitamin C"
                      className="w-full form-input px-3.5 py-2.5 bg-zinc-900 border border-white/5 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Target Audience & Market segment</label>
                    <input
                      type="text"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="e.g. Urban professionals aged 22-38 with busy lifestyles"
                      className="w-full form-input px-3.5 py-2.5 bg-zinc-900 border border-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Competitors to track (Optional)</label>
                    <input
                      type="text"
                      value={topCompetitors}
                      onChange={(e) => setTopCompetitors(e.target.value)}
                      placeholder="e.g. Flimty, Cool-vita, Byoote"
                      className="w-full form-input px-3.5 py-2.5 bg-zinc-900 border border-white/5 text-white"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={handleResetPhase2}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-white/5 hover:text-white rounded-xl transition-all font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Clear Chat & Formulation</span>
                  </button>

                  <button
                    onClick={handleLockStrategy}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-purple hover:shadow-purple-500/20 shadow-lg text-white font-bold rounded-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Strategy & Start Branding</span>
                  </button>
                </div>
              </div>
            ) : (
              // LOCKED READ-ONLY CARD STATE
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs bg-zinc-950/40 p-5 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block mb-1">Primary Ingredients</span>
                    <p className="text-sm font-semibold text-white">{phase2.sparringSummary?.formulation?.primaryIngredients || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block mb-1">Derivative Ingredients</span>
                    <p className="text-sm font-semibold text-white">{phase2.sparringSummary?.formulation?.derivativeIngredients || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block mb-1">Target Market</span>
                    <p className="text-sm font-semibold text-white">{phase2.sparringSummary?.formulation?.targetMarket || 'None'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Locked on {new Date(phase2.lockedAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={handleResetPhase2}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-xs font-bold"
                  >
                    <UnlockIcon className="h-3.5 w-3.5" />
                    <span>Unlock & Edit Strategy</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 3: BRAND BOOK & VISUAL ASSETS */}
      {activeTab === 'phase3' && phase2 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {project.phase_3_state ? (
            // LOCKED VIEW: Premium Read-Only Brand Book Presentation
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase tracking-widest font-extrabold block">Brand Identity Established</span>
                    <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">{project.phase_3_state.brandName}</h2>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResetPhase3}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-xs font-bold"
                  >
                    <UnlockIcon className="h-3.5 w-3.5" />
                    <span>Unlock & Edit Brand Book</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('phase4')}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-purple text-white hover:shadow-purple-500/20 shadow-lg font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Proceed to Pitch Deck</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Brand Details Card */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-5">
                    <h3 className="text-xs uppercase font-extrabold text-white tracking-wider border-b border-white/5 pb-3">Brand Book Profile</h3>
                    
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Brand Name</span>
                      <span className="text-base font-bold text-white mt-1 block">{project.phase_3_state.brandName}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Visual Aesthetic Direction</span>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{project.phase_3_state.visualAesthetic}</p>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Ingredients Formulation</span>
                      <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                        {phase2.sparringSummary?.formulation?.primaryIngredients} 
                        {phase2.sparringSummary?.formulation?.derivativeIngredients && ` (${phase2.sparringSummary?.formulation?.derivativeIngredients})`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Target Market Segment</span>
                      <span className="text-xs font-semibold text-zinc-200 mt-1 block">{phase2.sparringSummary?.formulation?.targetMarket}</span>
                    </div>
                  </div>
                </div>

                {/* Brand Visual Assets Gallery */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-zinc-950/40">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Approved 2D Packaging Layout</span>
                    </div>
                    <div className="bg-zinc-950 flex items-center justify-center p-6 aspect-square relative">
                      {project.phase_3_state.image2dUrl ? (
                        <img 
                          src={project.phase_3_state.image2dUrl} 
                          alt="2D Packaging Layout" 
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">No layout generated</span>
                      )}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-zinc-950/40">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Approved 3D Packaging Mockup</span>
                    </div>
                    <div className="bg-zinc-950 flex items-center justify-center p-6 aspect-square relative">
                      {project.phase_3_state.image3dUrl ? (
                        <img 
                          src={project.phase_3_state.image3dUrl} 
                          alt="3D Mockup" 
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">No mockup generated</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // INTERACTIVE MODE: Naming chat + Image generator & approval cards
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* LEFT COLUMN: BRAND NAME BRAINSTORM CHAT */}
              <div className="lg:col-span-5 flex flex-col glass-card rounded-2xl border border-white/5 overflow-hidden h-[650px]">
                <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Brand Naming Brainstorm</h3>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Brainstorm AI</span>
                  </div>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {phase3ChatMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-bl-none'
                        }`}
                      >
                        {m.role === 'assistant' && (
                          <div className="flex items-center space-x-1 text-purple-400 font-extrabold tracking-wider uppercase text-[9px] mb-1.5">
                            <Sparkles className="h-3 w-3" />
                            <span>Brainstorm AI</span>
                          </div>
                        )}
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {phase3ChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-900 border border-white/5 text-zinc-400 rounded-2xl rounded-bl-none p-4 text-xs flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                        <span>AI is brainstorming brand identities...</span>
                      </div>
                    </div>
                  )}
                  <div ref={phase3ChatBottomRef} />
                </div>

                {/* Quick Prompts */}
                <div className="p-3 border-t border-white/5 bg-zinc-950/20 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendPhase3Chat('Brainstorm brand name options')}
                    disabled={phase3ChatLoading}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[10px] font-semibold rounded-lg transition-all"
                  >
                    Brainstorm Names
                  </button>
                  <button
                    onClick={() => handleSendPhase3Chat('Suggest packaging visual concept & color palettes')}
                    disabled={phase3ChatLoading}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 text-zinc-400 hover:text-purple-300 text-[10px] font-semibold rounded-lg transition-all"
                  >
                    Suggest Visual Style
                  </button>
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPhase3Chat();
                  }}
                  className="p-3 bg-zinc-950/60 border-t border-white/5 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={phase3ChatInput}
                    onChange={(e) => setPhase3ChatInput(e.target.value)}
                    disabled={phase3ChatLoading}
                    placeholder="Suggest name prefixes, colors, typography styles..."
                    className="flex-1 form-input px-3 py-2.5 text-xs bg-zinc-900 border border-white/5 text-white outline-none rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={phase3ChatLoading || !phase3ChatInput.trim()}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* RIGHT COLUMN: BRAND PARAMS & IMAGE WORKSPACE */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                
                {/* Brand Name & Style Param Card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                    <span>Identity Parameters</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-1 space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Brand Name</label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. RimFit"
                        className="w-full form-input px-3 py-2 bg-zinc-900 border border-white/5 text-white rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Visual Aesthetic & Colors</label>
                      <input
                        type="text"
                        value={visualAesthetic}
                        onChange={(e) => setVisualAesthetic(e.target.value)}
                        placeholder="e.g. Botanical green & gold lines, clean serif fonts."
                        className="w-full form-input px-3 py-2 bg-zinc-900 border border-white/5 text-white rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* 2D & 3D Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                  
                  {/* 2D Layout Card */}
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">1. 2D Packaging Layout</span>
                      {image2dApproved && (
                        <span className="flex items-center text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Check className="h-3 w-3 mr-1" /> Approved
                        </span>
                      )}
                    </div>

                    <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-4 relative aspect-square">
                      {image2dLoading ? (
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
                          <span className="text-[10px] text-purple-400 tracking-wide block animate-pulse">Rasterizing 2D layout...</span>
                        </div>
                      ) : image2dUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <img 
                            src={image2dUrl} 
                            alt="2D Layout Preview" 
                            className="max-w-full max-h-[80%] object-contain rounded-lg"
                          />
                          {!image2dApproved && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg gap-2 p-2">
                              <button
                                onClick={() => setImage2dApproved(true)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-all"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleGenerateImage('2d')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-semibold text-[10px] rounded-lg transition-all"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Regenerate</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateImage('2d')}
                          className="flex flex-col items-center space-x-1 px-4 py-6 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01] w-full h-full justify-center transition-all"
                        >
                          <Upload className="h-8 w-8 text-zinc-600 mb-2" />
                          <span className="text-xs font-semibold">Generate 2D Flat Layout</span>
                          <span className="text-[9px] text-zinc-600 mt-1 max-w-[150px]">Generates printable label art for packaging</span>
                        </button>
                      )}
                    </div>

                    {image2dUrl && !image2dApproved && (
                      <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() => setImage2dApproved(true)}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve 2D Layout</span>
                        </button>
                        <button
                          onClick={() => handleGenerateImage('2d')}
                          className="flex items-center justify-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all"
                          title="Regenerate"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3D Mockup Card */}
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">2. 3D packaging Mockup</span>
                      {image3dApproved && (
                        <span className="flex items-center text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Check className="h-3 w-3 mr-1" /> Approved
                        </span>
                      )}
                    </div>

                    <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-4 relative aspect-square">
                      {!image2dApproved ? (
                        // LOCK OVERLAY
                        <div className="text-center p-6 space-y-3">
                          <Lock className="h-8 w-8 text-zinc-700 mx-auto" />
                          <span className="text-xs font-bold text-zinc-500 block">3D Mockup Locked</span>
                          <p className="text-[10px] text-zinc-600 max-w-[160px] mx-auto leading-relaxed">
                            Please finalize and approve your 2D Packaging Layout to unlock 3D mockup rendering.
                          </p>
                        </div>
                      ) : image3dLoading ? (
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
                          <span className="text-[10px] text-purple-400 tracking-wide block animate-pulse">Rendering 3D model...</span>
                        </div>
                      ) : image3dUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <img 
                            src={image3dUrl} 
                            alt="3D Mockup Preview" 
                            className="max-w-full max-h-[80%] object-contain rounded-lg"
                          />
                          {!image3dApproved && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg gap-2 p-2">
                              <button
                                onClick={() => setImage3dApproved(true)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-all"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleGenerateImage('3d')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-semibold text-[10px] rounded-lg transition-all"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Regenerate</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateImage('3d')}
                          className="flex flex-col items-center space-x-1 px-4 py-6 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01] w-full h-full justify-center transition-all"
                        >
                          <Sparkles className="h-8 w-8 text-zinc-600 mb-2" />
                          <span className="text-xs font-semibold">Generate 3D Mockup</span>
                          <span className="text-[9px] text-zinc-600 mt-1 max-w-[150px]">Renders product layout onto bottle/box with plain studio backdrop</span>
                        </button>
                      )}
                    </div>

                    {image3dUrl && !image3dApproved && (
                      <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() => setImage3dApproved(true)}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve 3D Mockup</span>
                        </button>
                        <button
                          onClick={() => handleGenerateImage('3d')}
                          className="flex items-center justify-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all"
                          title="Regenerate"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Lock Action Bar */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setImage2dUrl(null);
                      setImage2dApproved(false);
                      setImage3dUrl(null);
                      setImage3dApproved(false);
                      setBrandName('');
                      setVisualAesthetic('');
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-white/5 hover:text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Clear Generator Canvas</span>
                  </button>

                  <button
                    onClick={handleLockBrandBook}
                    disabled={!brandName.trim() || !visualAesthetic.trim() || !image2dApproved || !image3dApproved}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-purple disabled:opacity-50 text-white hover:shadow-purple-500/20 shadow-lg font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Brand Book & Assets</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* PHASE 4 PANEL */}
      {activeTab === 'phase4' && project && (
        <div className="space-y-6">
          {!project.phase_4_state ? (
            // Needs compilation
            <div className="max-w-2xl mx-auto my-12 p-8 glass-panel rounded-3xl border border-white/5 text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Phase 4: Pitch Deck Export</h3>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-md mx-auto">
                  Aggregate all e-commerce metrics, primary active ingredients, target market formulations, competitor statistics, and packaging renderings into an investor-ready Pitch Deck PDF.
                </p>
              </div>

              {/* Summary Checklist */}
              <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold border-b border-white/5 pb-2">Merged Sources Checklist</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Phase 1: BPOM Certified Product List ({phase1?.products?.length || 0} items)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Phase 2: Active Formulation & Competitor GMV Metrics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Phase 3: Brand Book ({brandName}) & 2D/3D Packaging Renders</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCompilePhase4}
                  disabled={phase4Compiling}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-purple hover:shadow-purple-500/20 shadow-lg text-white font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5 mx-auto disabled:opacity-50 disabled:transform-none"
                >
                  {phase4Compiling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compiling Deck Components...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Compile Pitch Deck Slides</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Compiled Slide Preview + PDF Iframe
            <div className="space-y-6">
              
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase tracking-widest font-extrabold block">Investor Deck Ready</span>
                  <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">{brandName} Pitch Deck</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleResetPhase4}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    <UnlockIcon className="h-3.5 w-3.5" />
                    <span>Unlock & Edit</span>
                  </button>
                  <a
                    href={`/api/projects/${projectId}/phase4/export`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-purple text-white hover:shadow-purple-500/20 shadow-lg font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Download PDF</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Main Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* LEFT COLUMN: INTERACTIVE SLIDES LIST */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  <h3 className="text-xs uppercase font-extrabold text-white tracking-widest px-1">Compiled Presentation Slides</h3>
                  
                  <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                    {project.phase_4_state.slides?.map((slide: Slide, idx: number) => {
                      const isSelected = selectedSlideIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedSlideIndex(idx)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/40 shadow-md'
                              : 'bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Slide {slide.slideNumber}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-purple-500' : 'bg-zinc-700'}`} />
                          </div>
                          
                          <h4 className="text-xs font-bold text-white truncate">{slide.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{slide.subtitle}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: DETAILED SLIDE INSPECTOR + LIVE PDF PREVIEW */}
                <div className="lg:col-span-7 flex flex-col space-y-6">
                  
                  {/* SLIDE CARD DETAIL */}
                  {project.phase_4_state.slides?.[selectedSlideIndex] && (
                    <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 text-left">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[9px] text-purple-400 uppercase tracking-widest font-extrabold">Active Slide Details</span>
                          <h3 className="text-lg font-black text-white leading-tight mt-0.5">
                            {project.phase_4_state.slides[selectedSlideIndex].title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-0.5">{project.phase_4_state.slides[selectedSlideIndex].subtitle}</p>
                        </div>
                        <span className="text-2xl font-black text-zinc-800">0{selectedSlideIndex + 1}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {project.phase_4_state.slides[selectedSlideIndex].content?.map((bullet: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-start space-x-2.5 text-xs text-zinc-300 leading-relaxed">
                            <span className="text-purple-500 font-bold mt-0.5">•</span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LIVE PDF PREVIEW FRAME */}
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[350px]">
                    <div className="p-3 bg-zinc-950/60 border-b border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider">Live Document Feed</span>
                      <span className="text-[9px] text-zinc-600 font-semibold">PDF RENDERING ENGINE (16:9)</span>
                    </div>
                    <div className="flex-1 bg-zinc-950">
                      <iframe
                        src={`/api/projects/${projectId}/phase4/export`}
                        className="w-full h-full border-none bg-zinc-950"
                        title="PDF Pitch Deck Previewer"
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Small wrapper inline component for local unlock icon
function UnlockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
