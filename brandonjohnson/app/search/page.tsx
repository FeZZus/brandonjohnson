import MapComponent from './MapComponent';

export default function SearchPage() {
    return (
        <div className="relative h-screen w-full">
            {/* Google Map background */}
            <div className="absolute inset-0">
                <MapComponent />
            </div>

            {/* Left floating panel */}
            <div className="absolute left-8 top-8 w-96 rounded-lg bg-white p-6 shadow-lg">
                <h1 className="mb-6 text-2xl font-bold text-gray-800">Search</h1>

                <div className="space-y-4">
                    {/* Location input */}
                    <div>
                        <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <input
                            id="location"
                            type="text"
                            placeholder="Enter a location"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Radius input */}
                    <div>
                        <label htmlFor="radius" className="mb-2 block text-sm font-medium text-gray-700">
                            Radius (km)
                        </label>
                        <input
                            id="radius"
                            type="number"
                            placeholder="Enter radius"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Description input */}
                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Enter a description"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Search button */}
                    <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors">
                        Search
                    </button>
                </div>
            </div>
        </div>
    );
}
