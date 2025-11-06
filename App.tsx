import React, { useState, useEffect } from 'react';
import { getGroundedResponse } from './services/geminiService';
import type { Coordinates, GroundingChunk } from './types';

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-8">
        <svg className="animate-spin h-10 w-10 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-4 text-lg text-gray-400">Searching nearby...</span>
    </div>
);

const SourceCard: React.FC<{ source: GroundingChunk }> = ({ source }) => {
    const mapInfo = source.maps;
    if (!mapInfo) return null;

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 transition-transform hover:scale-[1.02] hover:border-teal-500 duration-200">
            <div className="p-4">
                <a href={mapInfo.uri} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 font-semibold text-lg flex items-center">
                   <MapPinIcon />
                   <span className="ml-2">{mapInfo.title}</span>
                </a>
                {mapInfo.placeAnswerSources?.[0]?.reviewSnippets?.map((snippet, index) => (
                    <div key={index} className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                        <p className="italic">"{snippet.text}"</p>
                        <a href={snippet.uri} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline text-xs mt-1 inline-block">Read full review</a>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MapPinIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);


export default function App() {
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('Requesting location permissions...');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setError(null);
                setLoading(false);
            },
            (err) => {
                setError(`Geolocation error: ${err.message}. Please enable location services in your browser settings.`);
                setLoading(false);
            }
        );
    } else {
        setError("Geolocation is not supported by this browser.");
        setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading || !location) return;

    setLoading(true);
    setError(null);
    setResponse('');
    setSources([]);

    try {
        const result = await getGroundedResponse(query, location);
        setResponse(result.text);
        setSources(result.sources);
    } catch (apiError) {
        if (apiError instanceof Error) {
            setError(apiError.message);
        } else {
            setError("An unknown API error occurred.");
        }
    } finally {
        setLoading(false);
    }
  };
  
  const isSubmitDisabled = loading || !location || !query.trim();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-3xl mx-auto space-y-8">
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-teal-400">Aryaman Automatic GeoWorld finder</h1>
            <p className="mt-2 text-lg text-gray-400">Your intelligent guide to the world around you.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={!location ? "Waiting for location..." : "e.g., What's a good cafe nearby with outdoor seating?"}
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-base text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 resize-none"
                rows={3}
                disabled={!location || loading}
            />
            <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`mt-3 w-full font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center
                    ${isSubmitDisabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500'}`}
            >
               {loading ? 'Thinking...' : 'Ask AI'}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </form>

        {error && !loading && <ErrorAlert message={error} />}

        {loading && <LoadingSpinner />}

        {response && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
                <h2 className="text-2xl font-semibold text-teal-400 mb-4">Response</h2>
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                    {response}
                </div>
            </div>
        )}

        {sources.length > 0 && (
            <div className="animate-fade-in">
                <h2 className="text-2xl font-semibold text-teal-400 mb-4">Sources from Google Maps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sources.map((source, index) => (
                        <SourceCard key={index} source={source} />
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
