"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ThumbsUp, MessageCircle, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Mock Data for the Board & Members
const boardMembers = [
  { id: 1, name: "ALEXANDRE B.", role: "PRESIDENT", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "SARAH M.", role: "VICE PRESIDENT", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "THOMAS D.", role: "SECRETARY", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" },
  { id: 4, name: "LÉA G.", role: "TREASURER", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop" },
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
  authorName: string;
  authorImg: string;
  title: string;
  content: string;
  createdAt: Timestamp | null;
  likes: number;
  comments: number;
};

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch posts from Firestore
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenModal = () => {
    if (!user) {
      toast.error("You must be logged in to post.");
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
        authorName: user.displayName || user.email?.split("@")[0].toUpperCase() || "ANONYMOUS MEMBER",
        authorImg: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&auto=format&fit=crop", // Default user icon
        title: newTitle.toUpperCase(),
        content: newContent,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        tag: "PUBLISHED"
      });
      toast.success("Post published to the community!");
      setNewTitle("");
      setNewContent("");
      setIsModalOpen(false);
      fetchPosts(); // Reload feed
    } catch (error) {
      toast.error("Failed to publish post.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">CREATE NEW POST</h2>
            
            <form onSubmit={handlePostSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Post Title</label>
                <input 
                  type="text" 
                  autoFocus
                  maxLength={60}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. NEW TOURNAMENT IDEAS"
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Content</label>
                <textarea 
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your ideas with the association..."
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors resize-none"
                />
              </div>
              <button 
                disabled={isSubmitting}
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "PUBLISH POST"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#ffdbdb] leading-none uppercase drop-shadow-[0_0_15px_rgba(255,95,95,0.2)]">
              COMMUNITY
            </h1>
            <p className="mt-6 text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
              Share your ideas, suggestions, and updates with the association. Be part of the legacy.
            </p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase self-start"
          >
            <Plus size={16} strokeWidth={3} />
            NEW POST
          </button>
        </div>
      </section>

      {/* ── The Board ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-16">
        <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase mb-6">THE BOARD</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardMembers.map(member => (
            <div key={member.id} className="bg-[#161616] border border-white/5 rounded-3xl p-6 flex flex-col items-start gap-4 hover:bg-[#1a1a1a] transition-colors">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF5F5F]/30">
                <Image src={member.img} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">{member.name}</h3>
                <p className="text-[10px] font-bold text-[#c79a63] uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Split ── */}
      <section className="max-w-7xl mx-auto w-full px-6">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Latest from the community */}
          <div className="flex-[2] flex flex-col gap-6">
            <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase mb-2">LATEST FROM THE COMMUNITY</h2>
            
            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 size={32} className="text-[#FF5F5F] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[#161616] border border-white/5 rounded-[2rem] p-12 text-center flex flex-col items-center gap-4">
                <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">NO POSTS YET</h3>
                <p className="text-sm text-gray-400">Be the very first to share your thoughts with the BDJ Karukera community.</p>
                <button 
                  onClick={handleOpenModal}
                  className="mt-4 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300"
                >
                  START A CONVERSATION
                </button>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-[#161616] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6 relative group hover:border-white/10 transition-colors">
                  <div className="absolute top-8 right-8 bg-[#FF5F5F]/10 text-[#FF5F5F] border border-[#FF5F5F]/20 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    PUBLISHED
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
                    <button className="flex items-center gap-2 text-gray-500 hover:text-[#FF5F5F] transition-colors">
                      <ThumbsUp size={14} />
                      <span className="text-xs font-bold">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                      <MessageCircle size={14} />
                      <span className="text-xs font-bold">{post.comments}</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Bottom Auth CTA */}
            <div className="mt-4 bg-gradient-to-b from-[#1c1212] to-[#161111] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-4 py-16">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                {user ? "READY TO POST?" : "WANT TO JOIN THE CONVERSATION?"}
              </h2>
              <p className="text-gray-400 text-sm max-w-sm mb-4">
                {user 
                  ? "You are logged in! Share your updates or start a discussion with the association."
                  : "Login to post updates, comment on suggestions, or vote for new initiatives within BDJ Karukera."
                }
              </p>
              {user ? (
                <button 
                  onClick={handleOpenModal}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]"
                >
                  CREATE NEW POST
                </button>
              ) : (
                <Link href="/login">
                  <button className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-3.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F]">
                    LOGIN TO POST
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Our Members */}
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-[#ffdbdb] text-xl font-black tracking-tighter uppercase mb-2">OUR MEMBERS</h2>
            
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
              VIEW ALL MEMBERS
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
