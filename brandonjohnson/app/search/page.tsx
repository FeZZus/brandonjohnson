import MapComponent from './MapComponent';

export default function SearchPage() {
    return (
        <div className="relative h-screen w-full">
            {/* Map background */}
            <div className="absolute inset-0">
                <MapComponent />
            </div>

            {/* Left floating panel */}
            <div className="absolute left-8 top-8 w-96 rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
                <h1 className="mb-6 text-2xl font-bold text-slate-100">Search</h1>

                <div className="space-y-4">
                    {/* Location input */}
                    <div>
                        <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-400">
                            Location
                        </label>
                        <input
                            id="location"
                            type="text"
                            placeholder="Enter a location"
                            className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                        />
                    </div>

                    {/* Radius input */}
                    <div>
                        <label htmlFor="radius" className="mb-2 block text-sm font-medium text-slate-400">
                            Radius (km)
                        </label>
                        <input
                            id="radius"
                            type="number"
                            placeholder="Enter radius"
                            className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                        />
                    </div>

                    {/* Description input */}
                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-400">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Enter a description"
                            className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                        />
                    </div>

                    {/* Search button */}
                    <button className="w-full rounded-md bg-slate-600 px-4 py-2 text-slate-100 font-medium hover:bg-slate-500 transition-colors">
                        Search
                    </button>
                </div>
            </div>
        </div>
    );
}