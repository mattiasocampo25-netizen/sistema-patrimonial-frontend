export default function SkeletonLoader() {
    return (
        <div role="status" aria-label="Cargando datos" className="shimmer-wrap relative w-full flex-1 bg-surface-1 rounded-card border border-line shadow-card overflow-hidden flex flex-col">
            <span className="sr-only">Cargando datos…</span>
            <div className="sticky top-0 bg-surface-2/95 border-b border-line px-6 py-4 hidden md:flex justify-between">
                <div className="h-3 w-48 bg-surface-3 rounded-full"></div>
                <div className="h-3 w-32 bg-surface-3 rounded-full"></div>
                <div className="h-3 w-24 bg-surface-3 rounded-full"></div>
            </div>

            <div className="p-4 md:p-0 divide-y divide-line/60">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="mb-3 md:mb-0 p-4 md:px-6 md:py-4 border border-line md:border-0 rounded-card md:rounded-none flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 shrink-0 bg-surface-3 rounded-control"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-3 bg-surface-3 rounded-full w-1/3"></div>
                                <div className="h-2 bg-surface-3 rounded-full w-2/3 opacity-70"></div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 mt-2 md:mt-0 pt-2 border-t border-dashed md:border-none md:pt-0 border-line">
                            <div className="h-2 bg-surface-3 rounded-full w-1/2"></div>
                            <div className="h-2 bg-surface-3 rounded-full w-1/3 opacity-70"></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t md:border-none md:pt-0 border-line shrink-0">
                            <div className="h-8 w-8 bg-surface-3 rounded-control"></div>
                            <div className="h-8 w-8 bg-surface-3 rounded-control"></div>
                            <div className="h-8 w-8 bg-surface-3 rounded-control"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
