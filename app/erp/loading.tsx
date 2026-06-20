export default function ErpLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
        <span className="text-sm text-slate-400">جاري التحميل...</span>
      </div>
    </div>
  );
}
