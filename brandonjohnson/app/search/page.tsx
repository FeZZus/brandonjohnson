import MapComponent from './MapComponent';

export default function SearchPage() {
    return (
        <div className="relative h-screen w-full">
            <div className="absolute inset-0">
                <MapComponent />
            </div>

            <div className="absolute left-8 top-8 w-96 rounded-xl bg-gray-100 border border-gray-300 p-6 shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-gray-800">Search</h1>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-500">
                            Location
                        </label>
                        <input
                            id="location"
                            type="text"
                            placeholder="Enter a location"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>

                    <div>
                        <label htmlFor="radius" className="mb-2 block text-sm font-medium text-gray-500">
                            Radius (km)
                        </label>
                        <input
                            id="radius"
                            type="number"
                            placeholder="Enter radius"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-500">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Enter a description"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>

                    <button className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white font-medium hover:bg-gray-700 transition-colors">
                        Search
                    </button>
                </div>
            </div>
        </div>
    );
}