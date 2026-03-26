"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ThumbsUp, MessageCircle, X, Loader2, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", 0.7)); 
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Default Mock Data for Seeding
const DEFAULT_BOARD = [
  { name: "ALEXANDRE B.", role: "PRESIDENT", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop", descEn: "Alexandre brings visionary leadership and three years of competitive esports management to BDJ. He is dedicated to making this association the top collegiate gaming community in the region.", descFr: "Alexandre apporte un leadership visionnaire et trois ans de gestion d'esports compétitifs au DBJ. Il s'engage à faire de cette association la meilleure communauté de jeux universitaire de la région." },
  { name: "SARAH M.", role: "VICE PRESIDENT", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop", descEn: "As Vice President, Sarah oversees all major tournament logistics and community outreach programs. Her background in event management ensures our LAN parties are flawless.", descFr: "En tant que vice-présidente, Sarah supervise toute la logistique des tournois majeurs et les programmes de sensibilisation communautaire. Son expérience en gestion d'événements garantit que nos soirées LAN sont impeccables." },
  { name: "THOMAS D.", role: "SECRETARY", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop", descEn: "Thomas is the organizational backbone of BDJ Karukera. He manages communications, discord moderation, and ensures our community remains a safe and inclusive space.", descFr: "Thomas est l'épine dorsale organisationnelle de BDJ Karukera. Il gère les communications, la modération discord et veille à ce que notre communauté reste un espace sûr et inclusif." },
  { name: "LÉA G.", role: "TREASURER", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop", descEn: "Léa handles our sponsorships and treasury. Thanks to her financial strategy, we have been able to secure top-tier gaming equipment and prize pools for our members.", descFr: "Léa gère nos parrainages et notre trésorerie. Grâce à sa stratégie financière, nous avons pu sécuriser des équipements de jeu de haut niveau et des cagnottes pour nos membres." },
];

// Removed hardcoded regularMembers after switching to real user data from Firestore.

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
  const { isIceTheme } = useTheme();

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  // All Members
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [isAllMembersOpen, setIsAllMembersOpen] = useState(false);

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
        for (const defaultMember of DEFAULT_BOARD) {
          await addDoc(collection(db, "boardMembers"), defaultMember);
        }
        const newBoardSnapshot = await getDocs(collection(db, "boardMembers"));
        setBoardMembers(newBoardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoardMember[]);
      } else {
        setBoardMembers(boardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoardMember[]);
      }

      // Fetch All Users
      const usersSnap = await getDocs(collection(db, "users"));
      setAllMembers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  const handleDeletePost = (postId: string) => {
    setTargetDeleteId(postId);
    setIsDeletePostModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!targetDeleteId) return;
    const postId = targetDeleteId;
    setIsDeletePostModalOpen(false);

    try {
      await deleteDoc(doc(db, "posts", postId));
      toast.success("Post deleted.");
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      toast.error("Failed to delete post.");
      console.error(error);
    }
    setTargetDeleteId(null);
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
    setIsSubmitting(true);
    setIsSuccess(false);
    try {
      let finalImgUrl = boardForm.img || "";

      if (selectedFile) {
        finalImgUrl = await resizeImage(selectedFile, 300, 300);
      }

      const payload = { ...boardForm, img: finalImgUrl };

      if (boardForm.id) {
        await updateDoc(doc(db, "boardMembers", boardForm.id), payload);
        setBoardMembers(prev => prev.map(m => m.id === boardForm.id ? { ...m, ...payload } as BoardMember : m));
      } else {
        const docRef = await addDoc(collection(db, "boardMembers"), payload);
        setBoardMembers(prev => [...prev, { id: docRef.id, ...payload } as BoardMember]);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setBoardForm({});
        setSelectedFile(null);
        setIsEditBoardModalOpen(false);
      }, 1500);

    } catch (error) {
      toast.error("Action failed.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleAdminDeleteBoardMember = (id: string | undefined) => {
    if (!id || !isAdmin) return;
    setTargetDeleteId(id);
    setIsDeleteBoardModalOpen(true);
  };

  const confirmDeleteBoardMember = async () => {
    if (!targetDeleteId || !isAdmin) return;
    const id = targetDeleteId;
    setIsDeleteBoardModalOpen(false);

    try {
      await deleteDoc(doc(db, "boardMembers", id));
      toast.success("Board member removed.");
      fetchAllData();
    } catch (error) {
      toast.error("Action failed.");
      console.error(error);
    }
    setTargetDeleteId(null);
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
    <div className="flex-1 flex flex-col min-h-screen selection:bg-primary/30 pb-20 relative">

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
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.content}</label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t.community.contentPlaceholder}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-500 shadow-[var(--shadow-primary)]"
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
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors duration-500">
            <button
              onClick={() => { setIsEditBoardModalOpen(false); setBoardForm({}); setSelectedFile(null); }}
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
                <input required type="text" value={boardForm.name || ""} onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value.toUpperCase() })}                 className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors duration-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.role}</label>
                <input required type="text" value={boardForm.role || ""} onChange={(e) => setBoardForm({ ...boardForm, role: e.target.value.toUpperCase() })}                 className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors duration-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.imageUrl}</label>
                <div className="flex gap-2">
                  <input placeholder="https://..." type="url" value={boardForm.img || ""} onChange={(e) => setBoardForm({ ...boardForm, img: e.target.value })} className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" />
                  <label className="flex-shrink-0 cursor-pointer flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">
                    <Upload size={16} />
                    {selectedFile ? selectedFile.name.substring(0, 10) + "..." : "UPLOAD"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.descEn}</label>
                <textarea required rows={3} value={boardForm.descEn || ""} onChange={(e) => setBoardForm({ ...boardForm, descEn: e.target.value })} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{t.community.descFr}</label>
                <textarea required rows={3} value={boardForm.descFr || ""} onChange={(e) => setBoardForm({ ...boardForm, descFr: e.target.value })} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 resize-none" />
              </div>
              <div className="flex gap-4 mt-4 w-full">
                <button 
                  disabled={isSubmitting || isSuccess}
                  type="submit" 
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-500 ${isSuccess ? "bg-green-500 text-white" : "bg-primary hover:bg-primary/80 text-white"}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : isSuccess ? "SAVED ✔" : t.community.saveChanges}
                </button>
                {boardForm.id && (
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                        handleAdminDeleteBoardMember(boardForm.id);
                        setIsEditBoardModalOpen(false);
                        setBoardForm({});
                    }} 
                    className="bg-white/5 hover:bg-red-500/20 text-red-500 px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all"
                  >
                    DELETE
                  </button>
                )}
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setBoardForm({}); setSelectedFile(null); setIsEditBoardModalOpen(false); }} 
                  className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>

            <div className="mt-10 border-t border-white/5 pt-6 flex flex-col gap-3">
              <h3 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">{t.community.existingMembers}</h3>
              {boardMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] transition-colors duration-500">
                  <div className="flex items-center gap-3">
                    <Image src={m.img} alt={m.name} width={30} height={30} className="rounded-full w-8 h-8 object-cover" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white tracking-widest">{m.name}</span>
                      <span className="text-[9px] text-primary tracking-widest">{m.role}</span>
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
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-[3rem] w-full max-w-lg p-10 relative shadow-[0_0_50px_-15px_var(--shadow-primary)] flex flex-col items-center text-center animate-in zoom-in-95 duration-500 transition-colors">
            <button
              onClick={() => { setSelectedBoardMember(null); }}
              className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 mb-6 shadow-[0_0_30px_-5px_var(--shadow-primary)] transition-all duration-500">
              <Image src={selectedBoardMember.img} alt={selectedBoardMember.name} width={96} height={96} className="w-full h-full object-cover" />
            </div>

            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter mb-1 transition-colors duration-500">{selectedBoardMember.name}</h2>
            <p className="text-xs font-black text-primary tracking-[0.2em] uppercase mb-8 transition-colors duration-500">{selectedBoardMember.role}</p>

            <p className="text-sm text-gray-300 leading-relaxed max-w-sm transition-colors duration-500">
              {language === "EN" ? selectedBoardMember.descEn : selectedBoardMember.descFr}
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-32 pb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-[6rem] font-black tracking-tighter text-white leading-none uppercase drop-shadow-[0_0_15px_var(--shadow-primary)] transition-all duration-500">
              {t.community.heroTitle}
            </h1>
            <p className="mt-6 text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
              {t.community.heroDesc}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-500 shadow-[0_0_30px_-5px_var(--shadow-primary)] hover:shadow-[0_0_40px_-3px_var(--shadow-primary)] whitespace-nowrap uppercase self-start"
          >
            <Plus size={16} strokeWidth={3} />
            {t.community.newPost}
          </button>
        </div>
      </section>

      {/* ── The Board ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-black tracking-tighter uppercase transition-colors duration-500">{t.community.theBoard}</h2>
          {isAdmin && (
            <button
              onClick={() => { setBoardForm({}); setIsEditBoardModalOpen(true); }}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase transition-all duration-500"
            >
              {t.community.manageBoard}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardMembers.map(member => (
            <button key={member.id} onClick={() => setSelectedBoardMember(member)} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6 flex flex-col items-start gap-4 hover:border-primary/80 transition-all duration-500 text-left w-full group shadow-[var(--shadow-primary)]">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors duration-500">
                <Image src={member.img} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide transition-colors duration-500">{member.name}</h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest transition-colors duration-500">{member.role}</p>
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
            <h2 className="text-white text-xl font-black tracking-tighter uppercase mb-2 transition-colors duration-500">{t.community.latestPosts}</h2>

            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] p-12 text-center flex flex-col items-center gap-4 transition-all duration-500">
                <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">{t.community.noPosts}</h3>
                <p className="text-sm text-gray-400">{t.community.beTheFirst}</p>
                <button
                  onClick={handleOpenModal}
                  className="mt-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500"
                >
                  {t.community.startConversation}
                </button>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] p-8 flex flex-col gap-6 relative group hover:border-primary/50 transition-all duration-500">
                  <div className="absolute top-8 right-8 bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
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
                      className={`flex items-center gap-2 transition-colors ${post.likedBy?.includes(user?.uid || "") ? "text-primary" : "text-gray-500 hover:text-primary"}`}
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
                    <div className="mt-4 flex flex-col gap-4 pt-4 border-t border-white/5 animate-in fade-in duration-500">

                      {/* Comments List */}
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(!post.commentsList || post.commentsList.length === 0) ? (
                          <p className="text-xs text-gray-500 italic">{t.community.noCommentsYet}</p>
                        ) : (
                          post.commentsList.map(comment => (
                            <div key={comment.id} className="flex gap-3 bg-[var(--background)] p-3 rounded-2xl border border-[var(--border)] transition-colors duration-500">
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
                            className="flex-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors duration-500"
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
            <div className="mt-4 bg-[var(--glow-bg)] border border-[var(--border)] shadow-[inset_0_0_50px_var(--shadow-primary)] transition-all duration-500 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-4 py-16">
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
                  className="bg-primary hover:bg-primary/80 text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 shadow-[var(--shadow-primary)]"
                >
                  {t.community.createNewPost}
                </button>
              ) : (
                <Link href="/login">
                  <button className="bg-primary hover:bg-primary/80 text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 shadow-[var(--shadow-primary)]">
                    {t.community.loginToPost}
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Our Members */}
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-white transition-colors duration-500 text-xl font-black tracking-tighter uppercase mb-2">{t.community.ourMembers}</h2>

            <div className="grid grid-cols-2 gap-4">
              {allMembers.slice(0, 6).map(member => (
                <div key={member.id} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-primary/5 transition-all duration-500">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <Image 
                              src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.gamerTag || member.email || "User")}&background=${isIceTheme ? '101625' : '1a1a1a'}&color=${isIceTheme ? '3FCEEE' : 'FF5F5F'}`} 
                      alt={member.gamerTag || "Member"} 
                      width={48} 
                      height={48} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-white uppercase truncate max-w-[100px]">{member.gamerTag || member.email?.split('@')[0]}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{member.email?.includes('admin') ? 'ADMIN' : 'MEMBER'}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsAllMembersOpen(true)}
              className="w-full mt-2 bg-transparent border border-white/5 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white px-6 py-4 rounded-3xl text-[10px] font-black tracking-widest uppercase transition-all duration-500"
            >
              {t.community.viewAllMembers}
            </button>
          </div>

        </div>
      </section>

      {/* View All Members Modal */}
      {isAllMembersOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl transition-colors duration-500">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <div className="rotate-45">
                    <Plus size={24} className="text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Association Members</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{allMembers.length} Active Participants</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAllMembersOpen(false)} 
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Members Grid */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allMembers.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <Loader2 size={32} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading members list...</p>
                  </div>
                ) : (
                  allMembers.map((member) => (
                    <div key={member.id} className="group p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-primary/30 transition-all duration-500 flex flex-col items-center gap-4 text-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                          <Image 
                                    src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.gamerTag || member.email || "User")}&background=${isIceTheme ? '101625' : '1a1a1a'}&color=${isIceTheme ? '3FCEEE' : 'FF5F5F'}`} 
                            alt={member.gamerTag || "Member"} 
                            width={64} 
                            height={64} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[var(--background)] rounded-full"></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{member.gamerTag || member.email?.split('@')[0]}</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{member.email?.includes('admin') ? 'ADMIN' : 'STUDENT MEMBER'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-center">
              <button 
                onClick={() => setIsAllMembersOpen(false)}
                className="bg-primary hover:bg-primary/80 text-white px-10 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 shadow-[var(--shadow-primary)]"
              >
                Close Members List
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeletePostModalOpen}
        onClose={() => setIsDeletePostModalOpen(false)}
        onConfirm={confirmDeletePost}
        title="ERASE POST?"
        description={t.community.deletePostConfirm}
      />

      <DeleteConfirmModal
        isOpen={isDeleteBoardModalOpen}
        onClose={() => setIsDeleteBoardModalOpen(false)}
        onConfirm={confirmDeleteBoardMember}
        title="REMOVE MEMBER?"
        description="Remove this member from the board? This action is irreversible."
      />
    </div>
  );
}
