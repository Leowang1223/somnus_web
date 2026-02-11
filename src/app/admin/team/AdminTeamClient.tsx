'use client';

import { useState } from 'react';
import { UserPlus, Trash2, Shield, User, Mail, Key, X, Check } from 'lucide-react';
import { addUserAction, deleteUserAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function AdminTeamClient({ initialUsers }: { initialUsers: any[] }) {
    const { isOwner, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && !isOwner) {
            router.push('/admin');
        }
    }, [isOwner, isAuthenticated, router]);

    const [users, setUsers] = useState(initialUsers);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'support' });

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await addUserAction(formData);
            if (res.success) {
                setUsers([...users, res.user]);
                setIsAdding(false);
                setFormData({ name: '', email: '', password: '', role: 'support' });
            } else {
                alert(res.error || 'Failed to add user');
            }
        } catch (error) {
            alert('Error adding user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await deleteUserAction(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">團隊管理</h1>
                    <p className="text-gray-500 text-sm">管理儀式的核心成員與權限體系。</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-[#d8aa5b] text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm flex items-center gap-2 shadow-[0_0_20px_rgba(216,170,91,0.2)]"
                >
                    <UserPlus size={18} /> 新增成員
                </button>
            </header>

            {/* User List */}
            <div className="grid gap-4">
                {users.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-white/10 text-gray-500">
                        目前沒有其他成員。您是唯一的建築師。
                    </div>
                )}

                {users.map((user) => (
                    <div key={user.id || user.email} className="bg-[#111] border border-white/5 p-6 rounded-sm flex items-center justify-between group hover:border-[#d8aa5b]/30 transition-all duration-300">
                        <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full border border-white/5 ${user.role === 'owner' ? 'bg-[#d8aa5b]/10 text-[#d8aa5b]' : 'bg-white/5 text-gray-400'}`}>
                                {user.role === 'owner' ? <Shield size={20} /> : <User size={20} />}
                            </div>
                            <div>
                                <h3 className="text-white font-display text-lg tracking-wide">{user.name}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-wider mt-1.5">
                                    <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                                    <span className={`px-2 py-0.5 rounded-sm flex items-center gap-1 ${user.role === 'owner' ? 'bg-[#d8aa5b]/20 text-[#d8aa5b]' : 'bg-white/10 text-gray-400'}`}>
                                        {user.role === 'owner' ? <Shield size={10} /> : <User size={10} />}
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {user.role !== 'owner' && (
                            <button
                                onClick={() => handleDelete(user.id)}
                                className="p-3 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                                title="移除成員"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0a0a09] border border-white/10 w-full max-w-md p-10 rounded-sm shadow-2xl animate-in fade-in zoom-in-95 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d8aa5b] opacity-[0.05] blur-[60px] rounded-full pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-white font-display text-2xl uppercase tracking-widest mb-1">邀請新成員</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">擴展您的團隊</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">姓名</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-all"
                                        placeholder="顯示名稱"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">電子郵件</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-all"
                                        placeholder="user@somnus.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">初始密碼</label>
                                    <div className="relative">
                                        <input
                                            type="text" // Visible for admin creating it
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] transition-all pr-10 font-mono"
                                            placeholder="設定密碼..."
                                        />
                                        <Key size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1">請安全地將此密碼分享給新成員。</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-3">角色權限</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'support' })}
                                        className={`p-4 text-xs uppercase tracking-widest border transition-all flex flex-col items-center justify-center gap-2 rounded-sm ${formData.role === 'support' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                    >
                                        <User size={16} />
                                        <span>支援人員</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'owner' })}
                                        className={`p-4 text-xs uppercase tracking-widest border transition-all flex flex-col items-center justify-center gap-2 rounded-sm ${formData.role === 'owner' ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                    >
                                        <Shield size={16} />
                                        <span>所有者</span>
                                    </button>
                                </div>
                                <div className="mt-4 p-3 bg-white/5 rounded-sm border border-white/5">
                                    <p className="text-[10px] text-gray-400">
                                        <span className="text-white font-bold block mb-1 uppercase tracking-wider">權限說明:</span>
                                        {formData.role === 'support' ? '僅能存取訂單、產品內容編輯與客服系統。無法檢視財務報表或管理團隊成員。' : '擁有最高權限。可存取所有數據、編輯代碼與管理人員。'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#d8aa5b] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-all mt-4 disabled:opacity-50 shadow-lg shadow-[#d8aa5b]/10"
                            >
                                {loading ? '授權中...' : '確認新增成員'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
