"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ThumbsUp, MessageCircle, X, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

// Default Mock Data for Seeding
const DEFAULT_BOARD = [
  { name: "ALEXANDRE B.", role: "PRESIDENT", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop", descEn: "Alexandre brings visionary leadership and three years of competitive esports management to BDJ. He is dedicated to making this association the top collegiate gaming community in the region.", descFr: "Alexandre apporte un leadership visionnaire et trois ans de gestion d'esports compétitifs au DBJ. Il s'engage à faire de cette association la meilleure communauté de jeux universitaire de la région." },
  { name: "SARAH M.", role: "VICE PRESIDENT", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop", descEn: "As Vice President, Sarah oversees all major tournament logistics and community outreach programs. Her background in event management ensures our LAN parties are flawless.", descFr: "En tant que vice-présidente, Sarah supervise toute la logistique des tournois majeurs et les programmes de sensibilisation communautaire. Son expérience en gestion d'événements garantit que nos soirées LAN sont impeccables." },
  { name: "THOMAS D.", role: "SECRETARY", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop", descEn: "Thomas is the organizational backbone of BDJ Karukera. He manages communications, discord moderation, and ensures our community remains a safe and inclusive space.", descFr: "Thomas est l'épine dorsale organisationnelle de BDJ Karukera. Il gère les communications, la modération discord et veille à ce que notre communauté reste un espace sûr et inclusif." },
  { name: "LÉA G.", role: "TREASURER", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop", descEn: "Léa handles our sponsorships and treasury. Thanks to her financial strategy, we have been able to secure top-tier gaming equipment and prize pools for our members.", descFr: "Léa gère nos parrainages et notre trésorerie. Grâce à sa stratégie financière, nous avons pu sécuriser des équipements de jeu de haut niveau et des cagnottes pour nos membres." },
];

const regularMembers = [
  { id: 1, name: "CHLOE T.", role: "COLLABORATOR", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "MARCUS J.", role: "MEMBER", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "ELENA S.", role: "COLLABORATOR", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop" },
  { id: 4, name: "JULIANNE R.", role: "MEMBER", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop" },
  { id: 5, name: "SOFIA L.", role: "MEMBER", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop" },
  { id: 6, name: "VICTOR M.", role: "MEMBER", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
];

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorImg: string;
  title: string;
  content: string;
  createdAt: Timestamp | null;
  likedBy: string[];
  commentsList: {
    id: string;
    authorName: string;
    authorImg: string;
    content: string;
    createdAt: string;
  }[];
};

type BoardMember = {
  id: string;
  name: string;
  role: string;
  img: string;
  descEn: string;
  descFr: string;
};

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Board State
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [selectedBoardMember, setSelectedBoardMember] = useState<BoardMember | null>(null);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [boardForm, setBoardForm] = useState<Partial<BoardMember>>({});

  const isAdmin = user?.email === "admin@bdj-karukera.com";

  // Fetch Firestore Data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch Posts
      const postsQ = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(postsQ);
      setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);

      // Fetch Board
      const boardSnapshot = await getDocs(collection(db, "boardMembers"));
      if (boardSnapshot.empty) {
        // Seed database if empty
        for (const defaultMember of DEFAULT_BOARD) {
          await addDoc(collection(db, "boardMembers"), defaultMember);
        }
        const newBoardSnapshot = await getDocs(collection(db, "boardMembers"));
        setBoardMembers(newBoardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoardMember[]);
      } else {
        setBoardMembers(boardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoardMember[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenModal = () => {
    if (!user) {
      toast.error(t.community.loginToPost);
      router.push("/login");
      return;
    }
    setIsModalOpen(true);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0].toUpperCase() || "ANONYMOUS MEMBER",
        authorImg: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&auto=format&fit=crop", // Default user icon
        title: newTitle.toUpperCase(),
        content: newContent,
        createdAt: serverTimestamp(),
        likedBy: [],
        commentsList: [],
        tag: "PUBLISHED"
      });
      toast.success("Post published to the community!");
      setNewTitle("");
      setNewContent("");
      setIsModalOpen(false);
      fetchAllData(); // Reload feed
    } catch (error) {
      toast.error("Failed to publish post.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t.community.deletePostConfirm)) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      toast.success("Post deleted.");
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      toast.error("Failed to delete post.");
      console.error(error);
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!user) {
      toast.error(t.community.loginToLike);
      return;
    }
    
    const isLiked = post.likedBy?.includes(user.uid);
    const postRef = doc(db, "posts", post.id);

    try {
      // Optimistic UI update
      setPosts(posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            likedBy: isLiked 
              ? p.likedBy.filter(uid => uid !== user.uid)
              : [...(p.likedBy || []), user.uid]
          };
        }
        return p;
      }));

      // Firebase update
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      fetchAllData(); // Revert on failure
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      toast.error(t.community.loginToComment);
      return;
    }
    if (!commentText.trim()) return;

    setIsCommenting(true);
    const postRef = doc(db, "posts", postId);
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      authorName: user.displayName || user.email?.split("@")[0].toUpperCase() || "MEMBER",
      authorImg: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&auto=format&fit=crop",
      content: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      // Optimistic UI update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, commentsList: [...(p.commentsList || []), newComment] };
        }
        return p;
      }));

      // Firebase update
      await updateDoc(postRef, {
        commentsList: arrayUnion(newComment)
      });
      
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to post comment");
      fetchAllData(); // Revert on failure
    } finally {
      setIsCommenting(false);
    }
  };

  const handleAdminBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (boardForm.id) {
        // Update existing member
        await updateDoc(doc(db, "boardMembers", boardForm.id), { ...boardForm });
        toast.success("Board member updated.");
      } else {
        // Add new member
        await addDoc(collection(db, "boardMembers"), { ...boardForm });
        toast.success("Board member added.");
      }
      setBoardForm({});
      setIsEditBoardModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error("Action failed.");
      console.error(error);
    }
  };

  const handleAdminDeleteBoardMember = async (id: string | undefined) => {
    if (!id || !isAdmin) return;
    if (!confirm("Remove this member from the board?")) return;
    try {
      await deleteDoc(doc(db, "boardMembers", id));
      toast.success("Board member removed.");
      fetchAllData();
    } catch (error) {
      toast.error("Action failed.");
      console.error(error);
    }
  };

  // Format timestamp safely
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "JUST NOW";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();
    }
    return "UNKNOWN DATE";
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30 pb-20 relative">
      
      {/* ── Modal overlay ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">{t.community.createNewPost}</h2>
            
            <form onSubmit={handlePostSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.postTitle}</label>
                <input 
                  type="text" 
                  autoFocus
                  maxLength={60}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.community.postTitlePlaceholder}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.content}</label>
                <textarea 
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t.community.contentPlaceholder}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors resize-none"
                />
              </div>
              <button 
                disabled={isSubmitting}
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t.community.publishPost}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin Edit Board Modal ── */}
      {isEditBoardModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsEditBoardModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">
              {boardForm.id ? t.community.editBoardMember : t.community.addBoardMember}
            </h2>
            
            <form onSubmit={handleAdminBoardSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.name}</label>
                <input required type="text" value={boardForm.name || ""} onChange={(e) => setBoardForm({...boardForm, name: e.target.value.toUpperCase()})} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.role}</label>
                <input required type="text" value={boardForm.role || ""} onChange={(e) => setBoardForm({...boardForm, role: e.target.value.toUpperCase()})} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.imageUrl}</label>
                <input required type="url" value={boardForm.img || ""} onChange={(e) => setBoardForm({...boardForm, img: e.target.value})} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.descEn}</label>
                <textarea required rows={3} value={boardForm.descEn || ""} onChange={(e) => setBoardForm({...boardForm, descEn: e.target.value})} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.descFr}</label>
                <textarea required rows={3} value={boardForm.descFr || ""} onChange={(e) => setBoardForm({...boardForm, descFr: e.target.value})} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 resize-none" />
              </div>
              <button type="submit" className="mt-4 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300">
                {t.community.saveChanges}
              </button>
            </form>

            <div className="mt-10 border-t border-white/5 pt-6 flex flex-col gap-3">
              <h3 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">{t.community.existingMembers}</h3>
              {boardMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Image src={m.img} alt={m.name} width={30} height={30} className="rounded-full w-8 h-8 object-cover" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white tracking-widest">{m.name}</span>
                      <span className="text-[9px] text-[#FF5F5F] tracking-widest">{m.role}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBoardForm(m)} className="text-[10px] text-blue-400 hover:underline uppercase tracking-widest font-bold">{t.community.edit}</button>
                    <button onClick={() => handleAdminDeleteBoardMember(m.id)} className="text-[10px] text-red-500 hover:underline uppercase tracking-widest font-bold">{t.community.del}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedBoardMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[3rem] w-full max-w-lg p-10 relative shadow-[0_0_50px_-15px_rgba(255,95,95,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => { setSelectedBoardMember(null); }}
              className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF5F5F]/50 mb-6 shadow-[0_0_30px_-5px_#FF5F5F]">
              <Image src={selectedBoardMember.img} alt={selectedBoardMember.name} width={96} height={96} className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selectedBoardMember.name}</h2>
            <p className="text-xs font-black text-[#FF5F5F] tracking-[0.2em] uppercase mb-8">{selectedBoardMember.role}</p>

            <p className="text-sm text-gray-300 leading-relaxed max-w-sm">
              {language === "EN" ? selectedBoardMember.descEn : selectedBoardMember.descFr}
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#ffdbdb] leading-none uppercase drop-shadow-[0_0_15px_rgba(255,95,95,0.2)]">
              {t.community.heroTitle}
            </h1>
            <p className="mt-6 text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
              {t.community.heroDesc}
            </p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase self-start"
          >
            <Plus size={16} strokeWidth={3} />
            {t.community.newPost}
          </button>
        </div>
      </section>

      {/* ── The Board ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase">{t.community.theBoard}</h2>
          {isAdmin && (
            <button 
              onClick={() => { setBoardForm({}); setIsEditBoardModalOpen(true); }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase transition-colors"
            >
              {t.community.manageBoard}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardMembers.map(member => (
            <button key={member.id} onClick={() => setSelectedBoardMember(member)} className="bg-[#161616] border border-white/5 rounded-3xl p-6 flex flex-col items-start gap-4 hover:bg-[#1a1a1a] hover:border-[#FF5F5F]/30 transition-all text-left w-full group">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#FF5F5F] transition-colors">
                <Image src={member.img} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">{member.name}</h3>
                <p className="text-[10px] font-bold text-[#c79a63] uppercase tracking-widest">{member.role}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Bottom Split ── */}
      <section className="max-w-7xl mx-auto w-full px-6">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Latest from the community */}
          <div className="flex-[2] flex flex-col gap-6">
            <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase mb-2">{t.community.latestPosts}</h2>
            
            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 size={32} className="text-[#FF5F5F] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[#161616] border border-white/5 rounded-[2rem] p-12 text-center flex flex-col items-center gap-4">
                <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">{t.community.noPosts}</h3>
                <p className="text-sm text-gray-400">{t.community.beTheFirst}</p>
                <button 
                  onClick={handleOpenModal}
                  className="mt-4 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300"
                >
                  {t.community.startConversation}
                </button>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-[#161616] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6 relative group hover:border-white/10 transition-colors">
                  <div className="absolute top-8 right-8 bg-[#FF5F5F]/10 text-[#FF5F5F] border border-[#FF5F5F]/20 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    {t.community.publishedBadge}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                      <Image src={post.authorImg} alt={post.authorName} width={40} height={40} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{post.authorName}</span>
                      <span className="text-[10px] text-gray-500 font-medium tracking-wide">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase mb-3">{post.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed pr-8 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-6 mt-2 pt-6 border-t border-white/5">
                    <button 
                      onClick={() => handleToggleLike(post)}
                      className={`flex items-center gap-2 transition-colors ${post.likedBy?.includes(user?.uid || "") ? "text-[#FF5F5F]" : "text-gray-500 hover:text-[#FF5F5F]"}`}
                    >
                      <ThumbsUp size={14} className={post.likedBy?.includes(user?.uid || "") ? "fill-current" : ""} />
                      <span className="text-xs font-bold">{post.likedBy?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? "text-white" : "text-gray-500 hover:text-white"}`}
                    >
                      <MessageCircle size={14} />
                      <span className="text-xs font-bold">{post.commentsList?.length || 0}</span>
                    </button>
                    {(user?.uid === post.authorId || user?.email === "admin@bdj-karukera.com") && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="ml-auto flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Comments Section */}
                  {activeCommentPostId === post.id && (
                    <div className="mt-4 flex flex-col gap-4 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                      
                      {/* Comments List */}
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(!post.commentsList || post.commentsList.length === 0) ? (
                          <p className="text-xs text-gray-500 italic">{t.community.noCommentsYet}</p>
                        ) : (
                          post.commentsList.map(comment => (
                            <div key={comment.id} className="flex gap-3 bg-[#0a0a0a] p-3 rounded-2xl border border-white/5">
                              <Image src={comment.authorImg} alt={comment.authorName} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white">{comment.authorName}</span>
                                <span className="text-xs text-gray-400 mt-1">{comment.content}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment Input */}
                      {user ? (
                        <div className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                            placeholder={t.community.writeComment}
                            className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF5F5F]/50 transition-colors"
                          />
                          <button 
                            disabled={isCommenting || !commentText.trim()}
                            onClick={() => handleAddComment(post.id)}
                            className="bg-white/10 hover:bg-white/20 disabled:bg-transparent disabled:text-gray-600 disabled:border disabled:border-white/5 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                          >
                            {t.community.post}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mt-2">{t.community.loginToJoin}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Bottom Auth CTA */}
            <div className="mt-4 bg-gradient-to-b from-[#1c1212] to-[#161111] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-4 py-16">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                {user ? t.community.readyToPost : t.community.wantToJoin}
              </h2>
              <p className="text-gray-400 text-sm max-w-sm mb-4">
                {user 
                  ? t.community.loggedInDesc
                  : t.community.loggedOutDesc
                }
              </p>
              {user ? (
                <button 
                  onClick={handleOpenModal}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]"
                >
                  {t.community.createNewPost}
                </button>
              ) : (
                <Link href="/login">
                  <button className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]">
                    {t.community.loginToPost}
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Our Members */}
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase mb-2">{t.community.ourMembers}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {regularMembers.map(member => (
                <div key={member.id} className="bg-[#161616] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-[#1a1a1a] transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <Image src={member.img} alt={member.name} width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-white uppercase">{member.name}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-2 bg-transparent border border-white/5 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white px-6 py-4 rounded-3xl text-[10px] font-black tracking-widest uppercase transition-all duration-300">
              {t.community.viewAllMembers}
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
