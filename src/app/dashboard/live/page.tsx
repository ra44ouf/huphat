"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useApp } from "@/components/providers";
import { Radio, RefreshCw, AlertCircle, CheckCircle2, Tv, Link as LinkIcon, Trash2 } from "lucide-react";
import Link from "next/link";

interface LiveStream {
  id: string;
  channel_id: string;
  channel_name: string | null;
  video_id: string | null;
  title: string | null;
  is_active: boolean;
  updated_at: string;
}

export default function AdminLivePage() {
  const { user } = useApp();
  const supabase = createClient();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [channelInput, setChannelInput] = useState("");
  const [channelName, setChannelName] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

  const fetchStreams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('admin_id', user.id)
        .order('updated_at', { ascending: false });

      if (data) setStreams(data as LiveStream[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const handleCheckLive = async () => {
    if (!channelInput.trim()) {
      setMessage({ text: "يرجى إدخال معرّف القناة (Channel ID)", type: 'error' });
      return;
    }

    setChecking(true);
    setMessage(null);

    try {
      const res = await fetch("/api/youtube/live-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          channelId: channelInput.trim(),
          channelName: channelName.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "حدث خطأ أثناء الفحص", type: 'error' });
      } else {
        if (data.isLive) {
          setMessage({ text: `البث نشط الآن! تم تحديث الحالة. (${data.title})`, type: 'success' });
        } else {
          setMessage({ text: "القناة ليست في وضع البث المباشر حالياً.", type: 'info' });
        }
        setChannelInput("");
        setChannelName("");
        fetchStreams();
      }
    } catch {
      setMessage({ text: "تعذّر الاتصال بالخادم", type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القناة من قائمة البثوث؟")) return;
    try {
      const res = await fetch("/api/youtube/live-check", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: id }),
      });
      if (res.ok) {
        fetchStreams();
      } else {
        const data = await res.json();
        alert(data.error || "حدث خطأ أثناء الحذف");
      }
    } catch {
      alert("خطأ في الاتصال");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-shubuhat-green mb-2">إدارة البث المباشر</h1>
          <p className="text-shubuhat-text-3 font-medium">
            أضف قنواتك ليتم فحصها تلقائياً. الميزة تعمل بدون استهلاك كوتا اليوتيوب!
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-shubuhat-border-lite p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-shubuhat-green">فحص وإضافة قناة للبث</h2>
            <p className="text-sm text-shubuhat-text-3 font-bold">
              أدخل المعرف الرسمي للقناة (مثل: UCxxx...) لربطها بصفحة البث المباشر.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-shubuhat-green uppercase">معرّف القناة (Channel ID) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-4 flex items-center text-shubuhat-text-3">
                <LinkIcon size={18} />
              </div>
              <input 
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="UCxxxxxxxxxxxxxxxxx"
                dir="ltr"
                className="w-full py-3 pr-11 pl-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-red-400 outline-none text-left font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-shubuhat-green uppercase">اسم القناة (اختياري)</label>
            <input 
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="مثال: قناة الرد على الشبهات"
              className="w-full py-3 px-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-red-400 outline-none font-bold"
            />
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-4 font-bold text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' :
            message.type === 'error' ? 'bg-red-50 text-red-600' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <button 
          onClick={handleCheckLive}
          disabled={checking}
          className="bg-red-500 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 w-full md:w-auto justify-center"
        >
          {checking ? <RefreshCw size={18} className="animate-spin" /> : <Radio size={18} />}
          {checking ? "جاري الفحص..." : "فحص وإضافة البث"}
        </button>
      </div>

      <h3 className="text-xl font-black text-shubuhat-green mb-4 flex items-center gap-2">
        <Tv size={20} className="text-shubuhat-gold" />
        قنواتك المربوطة
      </h3>

      {loading ? (
        <div className="py-10 flex justify-center"><RefreshCw className="animate-spin text-shubuhat-gold" /></div>
      ) : streams.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-shubuhat-border-lite rounded-[32px] p-10 text-center">
          <p className="text-shubuhat-text-3 font-bold">لم تقم بإضافة أي قنوات للبث المباشر حتى الآن.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {streams.map((stream) => (
            <div key={stream.id} className={`bg-white rounded-[24px] border p-5 flex items-center justify-between transition-all ${
              stream.is_active ? 'border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-shubuhat-border-lite'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stream.is_active ? 'bg-red-500 text-white animate-pulse' : 'bg-shubuhat-green-ghost text-shubuhat-text-3'
                }`}>
                  <Radio size={24} />
                </div>
                <div>
                  <h4 className="font-black text-shubuhat-green text-lg">
                    {stream.channel_name || "قناة غير مسماة"}
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    {stream.is_active ? (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        بث نشط: {stream.title || "بدون عنوان"}
                      </span>
                    ) : (
                      <span className="text-shubuhat-text-3 font-medium">غير متصل حالياً</span>
                    )}
                    <span className="text-shubuhat-border-lite mx-1">|</span>
                    <span className="text-shubuhat-text-3 font-mono text-xs">{stream.channel_id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setChannelInput(stream.channel_id);
                    setChannelName(stream.channel_name || "");
                    handleCheckLive();
                  }}
                  className="bg-shubuhat-green-ghost text-shubuhat-green px-4 py-2 rounded-xl font-bold text-sm hover:bg-shubuhat-border-lite transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={14} /> تحديث الحالة
                </button>
                <button 
                  onClick={() => handleDelete(stream.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
