'use client';

import { useState } from 'react';
import { submitTicketAction, uploadFileAction } from "@/app/actions";
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function ReturnsPage() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileName(file ? file.name : '');
    };

    return (
        <div className="min-h-screen pt-32 px-8 bg-[#050505] text-white">
            <div className="max-w-2xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="font-display text-4xl mb-4">Returns & Claims</h1>
                    <p className="text-gray-400">
                        We are committed to perfection. If your ritual object is flawed, please provide details below.
                    </p>
                </header>

                {status === 'success' ? (
                    <div className="bg-[#111] border border-green-500/30 p-8 rounded-sm text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                        <h3 className="font-display text-2xl mb-2">Claim Submitted</h3>
                        <p className="text-gray-400">Your case ID has been generated. Our QA team will review your evidence and authorize your return within 24 hours.</p>
                        <button onClick={() => { setStatus('idle'); setFileName(''); }} className="mt-8 bg-[#d8aa5b] text-black px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors">Start New Claim</button>
                    </div>
                ) : (
                    <form action={async (formData) => {
                        setStatus('submitting');

                        // Upload file to Supabase Storage if provided
                        const file = formData.get('file') as File;
                        if (file && file.size > 0) {
                            const uploadData = new FormData();
                            uploadData.append('file', file);
                            uploadData.append('prefix', 'returns');
                            const uploadResult = await uploadFileAction(uploadData);
                            if (uploadResult.url) {
                                formData.set('image', uploadResult.url);
                            }
                        }

                        await submitTicketAction(formData);
                        setStatus('success');
                    }} className="space-y-8">
                        <input type="hidden" name="type" value="return" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2 font-bold">Order ID</label>
                                <input name="orderId" required placeholder="e.g. SOM-260210-1234" className="w-full bg-white/5 border border-white/10 p-4 text-white focus:border-[#d8aa5b] focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Reason</label>
                                <select name="reason" className="w-full bg-white/5 border border-white/10 p-4 text-white focus:border-[#d8aa5b] appearance-none focus:outline-none">
                                    <option>Damaged in Transit</option>
                                    <option>Defective Product</option>
                                    <option>Wrong Item Received</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Description of Issue</label>
                            <textarea name="message" required rows={5} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:border-[#d8aa5b] focus:outline-none" placeholder="Please describe the defect in detail..." />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Evidence Upload (Photo)</label>
                            <div className="border-2 border-dashed border-white/10 rounded-sm p-8 text-center hover:border-[#d8aa5b]/50 transition-colors group cursor-pointer relative">
                                <input type="file" name="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                <Upload className="mx-auto text-gray-600 group-hover:text-[#d8aa5b] mb-4 transition-colors" />
                                {fileName ? (
                                    <p className="text-sm text-[#d8aa5b]">{fileName}</p>
                                ) : (
                                    <p className="text-sm text-gray-400">Drag & drop or click to upload photo</p>
                                )}
                                <p className="text-xs text-gray-600 mt-2">JPG, PNG up to 5MB</p>
                            </div>
                        </div>

                        <div className="bg-yellow-900/10 border border-yellow-500/20 p-4 flex gap-4 items-start">
                            <AlertCircle className="text-yellow-500 shrink-0" size={20} />
                            <p className="text-[10px] text-yellow-200/80 leading-relaxed">
                                Please ensure the photo clearly shows the defect. We reserve the right to reject claims without sufficient evidence.
                            </p>
                        </div>

                        <button type="submit" disabled={status === 'submitting'} className="w-full bg-[#d8aa5b] text-black h-14 font-bold uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2">
                            {status === 'submitting' ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Claim'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
