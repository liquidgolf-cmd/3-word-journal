import { useState, useEffect } from 'react';
import { TOPICS } from './utils/constants';
import { loadUser, saveUser, clearUser, loadUserEntries, saveUserEntries, getUserStorageKey } from './utils/storage';
import { GOOGLE_CLIENT_ID, initializeGoogleSignIn, renderGoogleButton, decodeJWT, handleLogout as authLogout } from './utils/auth';
import MessageBanner from './components/MessageBanner';
import StatsBar from './components/StatsBar';

function App() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [entries, setEntries] = useState([]);
    const [word1, setWord1] = useState('');
    const [word2, setWord2] = useState('');
    const [word3, setWord3] = useState('');
    const [topic, setTopic] = useState('');
    const [fullStory, setFullStory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [viewMode, setViewMode] = useState('grid');
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalEntry, setModalEntry] = useState(null);
    const [inputMode, setInputMode] = useState('manual');
    const [suggestedWords, setSuggestedWords] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [experienceText, setExperienceText] = useState('');
    const [isCustomTopic, setIsCustomTopic] = useState(false);
    const [customTopic, setCustomTopic] = useState('');
    const [experienceDate, setExperienceDate] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editWords, setEditWords] = useState(['', '', '']);
    const [showAiNotice, setShowAiNotice] = useState(false);
    const [isEditingStory, setIsEditingStory] = useState(false);
    const [editStory, setEditStory] = useState('');
    const [isEditingTopic, setIsEditingTopic] = useState(false);
    const [editTopic, setEditTopic] = useState('');
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [editDate, setEditDate] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Initialize Google Sign-In
    useEffect(() => {
        const savedUser = loadUser();
        if (savedUser && savedUser.sub && savedUser.email) {
            setUser(savedUser);
            setIsAuthenticated(true);
            const userEntries = loadUserEntries(savedUser.sub);
            setEntries(userEntries);
        }

        const initGoogle = () => {
            if (GOOGLE_CLIENT_ID) {
                initializeGoogleSignIn(handleCredentialResponse);
            }
        };

        if (typeof window !== 'undefined' && window.google) {
            initGoogle();
        } else {
            const checkGoogle = setInterval(() => {
                if (typeof window !== 'undefined' && window.google) {
                    clearInterval(checkGoogle);
                    initGoogle();
                }
            }, 100);
            setTimeout(() => clearInterval(checkGoogle), 5000);
        }
    }, []);

    // Render Google Sign-In button
    useEffect(() => {
        if (!isAuthenticated && GOOGLE_CLIENT_ID) {
            const timer = setTimeout(() => {
                renderGoogleButton('google-signin-button');
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    const handleCredentialResponse = (response) => {
        try {
            const userData = decodeJWT(response.credential);
            if (!userData) {
                throw new Error('Failed to decode user data');
            }
            
            const userInfo = {
                name: userData.name,
                email: userData.email,
                picture: userData.picture,
                sub: userData.sub
            };
            
            setUser(userInfo);
            setIsAuthenticated(true);
            saveUser(userInfo);
            const userEntries = loadUserEntries(userData.sub);
            setEntries(userEntries);
        } catch (e) {
            console.error('Error processing credential:', e);
            setError('Error signing in. Please try again.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleLogout = () => {
        authLogout();
        setUser(null);
        setIsAuthenticated(false);
        setEntries([]);
        clearUser();
    };

    // Save entries when they change
    useEffect(() => {
        if (isAuthenticated && user && entries.length >= 0) {
            saveUserEntries(user.sub, entries);
        }
    }, [entries, isAuthenticated, user]);

    const generateThreeWords = async () => {
        if (!experienceText.trim()) {
            setError('Please describe your experience first');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsGenerating(true);
        setSuggestedWords([]);
        setError(null);

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [{
                        role: "user",
                        content: `Based on this experience, suggest exactly 3 words that capture its essence. Follow these rules from "The 3 Word Journal":
- Use specific, concrete words (not generalities)
- Include a person, place, or thing if possible
- Make the words uniquely identify this experience
- Words should be memorable and evocative

Experience: "${experienceText}"

Respond with ONLY 3 words separated by commas, nothing else.`
                    }],
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error('Unexpected API response format');
            }
            
            const text = data.content[0].text.trim();
            const words = text.split(',').map(w => w.trim()).filter(w => w.length > 0).slice(0, 3);
            
            if (words.length < 3) {
                throw new Error('AI did not return 3 words. Try rephrasing your experience.');
            }
            
            setSuggestedWords(words);
            setWord1(words[0] || '');
            setWord2(words[1] || '');
            setWord3(words[2] || '');
        } catch (error) {
            console.error('Error generating words:', error);
            setError(`AI word generation failed: ${error.message}. Switching to Manual Entry mode...`);
            setInputMode('manual');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        if (!word1 || !word2 || !word3) {
            setError('Please fill in all three words');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const finalTopic = isCustomTopic ? customTopic : topic;
        if (!finalTopic) {
            setError('Please select or enter a topic');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const newEntry = {
            id: Date.now(),
            words: [word1, word2, word3],
            topic: finalTopic,
            experienceSummary: experienceText,
            fullStory: '',
            date: new Date().toISOString(),
            experienceDate: experienceDate || new Date().toISOString()
        };

        setEntries([newEntry, ...entries]);
        
        // Reset form
        setWord1('');
        setWord2('');
        setWord3('');
        setTopic('');
        setFullStory('');
                setExperienceText('');
                setSuggestedWords([]);
                setIsCustomTopic(false);
                setCustomTopic('');
                setExperienceDate('');
                setSuccessMessage('Entry saved successfully!');
                setTimeout(() => setSuccessMessage(null), 3000);
            };

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const deleteEntry = (id) => {
        setEntries(entries.filter(e => e.id !== id));
        setDeleteConfirmId(null);
        setSuccessMessage('Entry deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const openModal = (entry) => {
        setModalEntry(entry);
        setShowModal(true);
        setIsEditMode(false);
        setEditWords([...entry.words]);
        setIsEditingStory(false);
        setEditStory(entry.fullStory || '');
        setIsEditingTopic(false);
        setEditTopic(entry.topic);
        setIsEditingDate(false);
        setEditDate(entry.experienceDate || entry.date);
    };

    const startEdit = () => setIsEditMode(true);
    const cancelEdit = () => {
        setIsEditMode(false);
        setEditWords([...modalEntry.words]);
    };

    const saveEdit = () => {
        if (!editWords[0] || !editWords[1] || !editWords[2]) {
            setError('All three words are required');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, words: editWords }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, words: editWords });
        setIsEditMode(false);
    };

    const startEditStory = () => setIsEditingStory(true);
    const cancelEditStory = () => {
        setIsEditingStory(false);
        setEditStory(modalEntry.fullStory || '');
    };

    const saveStory = () => {
        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, fullStory: editStory }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, fullStory: editStory });
        setIsEditingStory(false);
    };

    const startEditTopic = () => setIsEditingTopic(true);
    const cancelEditTopic = () => {
        setIsEditingTopic(false);
        setEditTopic(modalEntry.topic);
    };

    const saveTopic = () => {
        if (!editTopic.trim()) {
            setError('Topic cannot be empty');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, topic: editTopic }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, topic: editTopic });
        setIsEditingTopic(false);
    };

    const startEditDate = () => setIsEditingDate(true);
    const cancelEditDate = () => {
        setIsEditingDate(false);
        setEditDate(modalEntry.experienceDate || modalEntry.date);
    };

    const saveDate = () => {
        if (!editDate) {
            setError('Date cannot be empty');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const updatedEntries = entries.map(entry => 
            entry.id === modalEntry.id 
                ? { ...entry, experienceDate: editDate }
                : entry
        );

        setEntries(updatedEntries);
        setModalEntry({ ...modalEntry, experienceDate: editDate });
        setIsEditingDate(false);
    };

    // Filter entries
    const filteredEntries = entries.filter(entry => {
        const matchesSearch = searchTerm === '' || 
            entry.words.some(w => w.toLowerCase().includes(searchTerm.toLowerCase())) ||
            entry.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.experienceSummary && entry.experienceSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (entry.fullStory && entry.fullStory.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesTopic = selectedTopic === 'All' || entry.topic === selectedTopic;
        
        return matchesSearch && matchesTopic;
    });

    // Data Export/Import
    const exportData = () => {
        const dataStr = JSON.stringify(entries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `3-word-journal-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccessMessage('Data exported successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    setEntries([...imported, ...entries]);
                    setSuccessMessage(`Successfully imported ${imported.length} entries!`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setError('Invalid file format. Expected an array of entries.');
                    setTimeout(() => setError(null), 5000);
                }
            } catch (err) {
                setError('Error reading file: ' + err.message);
                setTimeout(() => setError(null), 5000);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    // Get unique topics from entries
    const usedTopics = ['All', ...new Set(entries.map(e => e.topic))].sort();

    // Calculate stats
    const stats = {
        total: entries.length,
        topics: new Set(entries.map(e => e.topic)).size,
        thisMonth: entries.filter(e => {
            const entryDate = new Date(e.experienceDate || e.date);
            const now = new Date();
            return entryDate.getMonth() === now.getMonth() && 
                   entryDate.getFullYear() === now.getFullYear();
        }).length,
        withStories: entries.filter(e => e.fullStory && e.fullStory.length > 0).length
    };

    // Show login screen if not authenticated
    if (!isAuthenticated || !GOOGLE_CLIENT_ID) {
        return (
            <div className="app-container">
                <header className="header">
                    <h1>3 Word Journal</h1>
                    <p className="subtitle">Capture life's lessons in just three words</p>
                </header>
                <div className="login-prompt">
                    <h2>Sign in to continue</h2>
                    <p>Sign in with your Google account to access your journal entries and sync them across devices.</p>
                    <div id="google-signin-button"></div>
                    {!GOOGLE_CLIENT_ID && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(196, 166, 97, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--warm-brown)',
                            fontSize: '0.9rem',
                            border: '2px solid var(--accent-gold)'
                        }}>
                            <strong>⚠️ Setup Required:</strong><br/>
                            Please set VITE_GOOGLE_CLIENT_ID in your .env file<br/>
                            See GOOGLE_OAUTH_SETUP.md for instructions.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="auth-container">
                <div className="user-info">
                    <img src={user.picture} alt={user.name} className="user-avatar" />
                    <span className="user-name">{user.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={exportData}
                            aria-label="Export journal data"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                            📥 Export
                        </button>
                        <label 
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', cursor: 'pointer', margin: 0 }}
                            aria-label="Import journal data"
                        >
                            📤 Import
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={importData}
                                style={{ display: 'none' }}
                                aria-label="Import journal data file"
                            />
                        </label>
                        <button 
                            className="btn-logout" 
                            onClick={handleLogout}
                            aria-label="Sign out"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
            <header className="header">
                <h1>3 Word Journal</h1>
                <p className="subtitle">Capture life's lessons in just three words</p>
            </header>

            {/* Error and Success Messages */}
            <MessageBanner 
                message={error} 
                type="error" 
                onDismiss={() => setError(null)} 
            />
            <MessageBanner 
                message={successMessage} 
                type="success" 
                onDismiss={() => setSuccessMessage(null)} 
            />

            <StatsBar stats={stats} />

            <div className="main-layout">
                <div className="quick-entry-card">
                    <h2>New Entry</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Entry Mode</label>
                            <div className="input-mode-toggle" role="tablist">
                                <div 
                                    className={`toggle-option ${inputMode === 'ai' ? 'active' : ''}`}
                                    onClick={() => setInputMode('ai')}
                                    role="tab"
                                    aria-selected={inputMode === 'ai'}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setInputMode('ai');
                                        }
                                    }}
                                >
                                    ✨ AI Suggested
                                </div>
                                <div 
                                    className={`toggle-option ${inputMode === 'manual' ? 'active' : ''}`}
                                    onClick={() => setInputMode('manual')}
                                    role="tab"
                                    aria-selected={inputMode === 'manual'}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setInputMode('manual');
                                        }
                                    }}
                                >
                                    ✍️ Manual Entry
                                </div>
                            </div>
                            {inputMode === 'ai' && (
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--soft-gray)',
                                    marginTop: '0.5rem',
                                    fontStyle: 'italic'
                                }}>
                                    Note: AI generation requires an active internet connection and may have limitations in some browsers.
                                </div>
                            )}
                        </div>

                        {inputMode === 'ai' ? (
                            <>
                                <div className="form-group">
                                    <label htmlFor="experience-text">Describe Your Experience</label>
                                    <textarea
                                        id="experience-text"
                                        placeholder="Tell me about what happened... I'll help you distill it into three words."
                                        value={experienceText}
                                        onChange={(e) => setExperienceText(e.target.value)}
                                        rows="4"
                                        aria-label="Describe your experience for AI word generation"
                                    />
                                </div>

                                {suggestedWords.length > 0 && (
                                    <div className="ai-suggestions-container">
                                        <div className="ai-suggestions-header">
                                            <h3>✨ Suggested Words</h3>
                                            <button 
                                                type="button"
                                                className="btn-generate"
                                                onClick={generateThreeWords}
                                                disabled={isGenerating}
                                                aria-label="Regenerate word suggestions"
                                            >
                                                {isGenerating ? <span className="loading-spinner"></span> : 'Regenerate'}
                                            </button>
                                        </div>
                                        <div className="suggested-words">
                                            {suggestedWords.map((word, i) => (
                                                <div 
                                                    key={i}
                                                    className="suggested-word selected"
                                                >
                                                    {word}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="suggestion-info">
                                            Click "Regenerate" for different suggestions, or edit the words below
                                        </div>
                                    </div>
                                )}

                                {suggestedWords.length === 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <button 
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={generateThreeWords}
                                            disabled={isGenerating || !experienceText.trim()}
                                            aria-label="Generate three words from your experience"
                                        >
                                            {isGenerating ? (
                                                <><span className="loading-spinner"></span> Generating...</>
                                            ) : (
                                                'Generate Three Words'
                                            )}
                                        </button>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Edit Your Three Words</label>
                                    <div className="three-words-input">
                                        <input
                                            type="text"
                                            placeholder="Word 1"
                                            value={word1}
                                            onChange={(e) => setWord1(e.target.value)}
                                            maxLength="20"
                                            aria-label="First word"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Word 2"
                                            value={word2}
                                            onChange={(e) => setWord2(e.target.value)}
                                            maxLength="20"
                                            aria-label="Second word"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Word 3"
                                            value={word3}
                                            onChange={(e) => setWord3(e.target.value)}
                                            maxLength="20"
                                            aria-label="Third word"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Three Words</label>
                                    <div className="three-words-input">
                                        <input
                                            type="text"
                                            placeholder="Word 1"
                                            value={word1}
                                            onChange={(e) => setWord1(e.target.value)}
                                            maxLength="20"
                                            aria-label="First word"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Word 2"
                                            value={word2}
                                            onChange={(e) => setWord2(e.target.value)}
                                            maxLength="20"
                                            aria-label="Second word"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Word 3"
                                            value={word3}
                                            onChange={(e) => setWord3(e.target.value)}
                                            maxLength="20"
                                            aria-label="Third word"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="experience-summary">Describe Your Experience (Optional)</label>
                                    <textarea
                                        id="experience-summary"
                                        placeholder="Quick summary of what happened..."
                                        value={experienceText}
                                        onChange={(e) => setExperienceText(e.target.value)}
                                        rows="4"
                                        aria-label="Optional experience summary"
                                    />
                                    <div style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginTop: '0.5rem', fontStyle: 'italic'}}>
                                        You can add the full detailed story later
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="topic-select">Memory Cue / Topic</label>
                            <div className="topic-input-wrapper">
                                {isCustomTopic ? (
                                    <>
                                        <input
                                            id="topic-custom"
                                            type="text"
                                            placeholder="Enter your custom topic..."
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                            maxLength="50"
                                            aria-label="Custom topic"
                                        />
                                        <span 
                                            className="custom-topic-toggle"
                                            onClick={() => {
                                                setIsCustomTopic(false);
                                                setCustomTopic('');
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setIsCustomTopic(false);
                                                    setCustomTopic('');
                                                }
                                            }}
                                        >
                                            ← Back to preset topics
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <select 
                                            id="topic-select"
                                            value={topic} 
                                            onChange={(e) => setTopic(e.target.value)}
                                            aria-label="Select a topic"
                                        >
                                            <option value="">Select a topic...</option>
                                            {TOPICS.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <span 
                                            className="custom-topic-toggle"
                                            onClick={() => setIsCustomTopic(true)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setIsCustomTopic(true);
                                                }
                                            }}
                                        >
                                            + Add custom topic
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="experience-date">When Did This Happen?</label>
                            <input
                                id="experience-date"
                                type="date"
                                value={experienceDate}
                                onChange={(e) => setExperienceDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                aria-label="Date when the experience happened"
                            />
                            <div style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginTop: '0.5rem', fontStyle: 'italic'}}>
                                Leave blank to use today's date
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            aria-label="Save new journal entry"
                        >
                            Save Entry
                        </button>
                    </form>
                </div>

                <div className="entries-section">
                    <div className="section-header">
                        <h2>Your Journal</h2>
                        <div className="view-toggle" role="tablist">
                            <button 
                                className={viewMode === 'grid' ? 'active' : ''}
                                onClick={() => setViewMode('grid')}
                                role="tab"
                                aria-selected={viewMode === 'grid'}
                                aria-label="Grid view"
                            >
                                Grid
                            </button>
                            <button 
                                className={viewMode === 'list' ? 'active' : ''}
                                onClick={() => setViewMode('list')}
                                role="tab"
                                aria-selected={viewMode === 'list'}
                                aria-label="List view"
                            >
                                List
                            </button>
                        </div>
                    </div>

                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search your journal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search journal entries"
                        />
                    </div>

                    <div className="topic-filter" role="group" aria-label="Filter by topic">
                        {usedTopics.map(t => (
                            <button
                                key={t}
                                className={`topic-tag ${selectedTopic === t ? 'active' : ''}`}
                                onClick={() => setSelectedTopic(t)}
                                aria-pressed={selectedTopic === t}
                                aria-label={`Filter by ${t} topic`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {filteredEntries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon" aria-hidden="true">📖</div>
                            <h3>No entries yet</h3>
                            <p>Start capturing your life's experiences in three words</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="entries-grid" role="list">
                            {filteredEntries.map(entry => (
                                <div 
                                    key={entry.id} 
                                    className="entry-card"
                                    onClick={() => openModal(entry)}
                                    role="listitem"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openModal(entry);
                                        }
                                    }}
                                    aria-label={`Entry: ${entry.words.join(', ')} - ${entry.topic}`}
                                >
                                    <div className="entry-date">
                                        {new Date(entry.experienceDate || entry.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="entry-words">
                                        {entry.words.map((word, i) => (
                                            <span key={i} className="word-badge">{word}</span>
                                        ))}
                                    </div>
                                    <div className="entry-topic">{entry.topic}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="entries-list" role="list">
                            {filteredEntries.map(entry => (
                                <div 
                                    key={entry.id} 
                                    className="entry-list-item"
                                    onClick={() => openModal(entry)}
                                    role="listitem"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openModal(entry);
                                        }
                                    }}
                                    aria-label={`Entry: ${entry.words.join(', ')} - ${entry.topic}`}
                                >
                                    <div className="entry-date">
                                        {new Date(entry.experienceDate || entry.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="entry-words">
                                        {entry.words.map((word, i) => (
                                            <span key={i} className="word-badge">{word}</span>
                                        ))}
                                    </div>
                                    <div className="entry-topic">{entry.topic}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && modalEntry && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setShowModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 id="modal-title">Entry Details</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Date Section */}
                        {isEditingDate ? (
                            <div className="inline-edit-container">
                                <div className="inline-edit-label">Edit Experience Date</div>
                                <input
                                    type="date"
                                    value={editDate.split('T')[0]}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid var(--accent-gold)',
                                        borderRadius: '6px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        marginBottom: '0.75rem'
                                    }}
                                    aria-label="Edit experience date"
                                />
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveDate} style={{ flex: 1 }} aria-label="Save date">
                                        Save Date
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditDate} style={{ flex: 1 }} aria-label="Cancel editing date">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="entry-date" 
                                style={{marginBottom: '0.5rem', fontSize: '1rem', cursor: 'pointer'}} 
                                onClick={startEditDate}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        startEditDate();
                                    }
                                }}
                                aria-label="Click to edit experience date"
                            >
                                <strong>Experience Date:</strong><br/>
                                {new Date(modalEntry.experienceDate || modalEntry.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                <span style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginLeft: '0.5rem'}}>✏️ Click to edit</span>
                            </div>
                        )}

                        {modalEntry.experienceDate && modalEntry.experienceDate !== modalEntry.date && !isEditingDate && (
                            <div className="entry-date" style={{marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.7}}>
                                Recorded: {new Date(modalEntry.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        )}

                        {/* Three Words Section */}
                        {isEditMode ? (
                            <div className="edit-mode-container">
                                <div className="inline-edit-label">Edit Three Words</div>
                                <div className="edit-words-input">
                                    <input
                                        type="text"
                                        value={editWords[0]}
                                        onChange={(e) => setEditWords([e.target.value, editWords[1], editWords[2]])}
                                        maxLength="20"
                                        placeholder="Word 1"
                                        aria-label="Edit first word"
                                    />
                                    <input
                                        type="text"
                                        value={editWords[1]}
                                        onChange={(e) => setEditWords([editWords[0], e.target.value, editWords[2]])}
                                        maxLength="20"
                                        placeholder="Word 2"
                                        aria-label="Edit second word"
                                    />
                                    <input
                                        type="text"
                                        value={editWords[2]}
                                        onChange={(e) => setEditWords([editWords[0], editWords[1], e.target.value])}
                                        maxLength="20"
                                        placeholder="Word 3"
                                        aria-label="Edit third word"
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveEdit} style={{ flex: 1 }} aria-label="Save words">
                                        Save Words
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEdit} style={{ flex: 1 }} aria-label="Cancel editing words">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{marginBottom: '1rem'}}>
                                <div className="entry-words">
                                    {modalEntry.words.map((word, i) => (
                                        <span key={i} className="word-badge">{word}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Topic Section */}
                        {isEditingTopic ? (
                            <div className="inline-edit-container">
                                <div className="inline-edit-label">Edit Topic</div>
                                <input
                                    type="text"
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    maxLength="50"
                                    placeholder="Enter topic..."
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid var(--accent-gold)',
                                        borderRadius: '6px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        marginBottom: '0.75rem'
                                    }}
                                    aria-label="Edit topic"
                                />
                                <div style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginBottom: '0.75rem', fontStyle: 'italic'}}>
                                    Or select from presets:
                                </div>
                                <select 
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid rgba(196, 166, 97, 0.3)',
                                        borderRadius: '6px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        marginBottom: '0.75rem'
                                    }}
                                    aria-label="Select topic from presets"
                                >
                                    <option value="">Choose a preset topic...</option>
                                    {TOPICS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveTopic} style={{ flex: 1 }} aria-label="Save topic">
                                        Save Topic
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditTopic} style={{ flex: 1 }} aria-label="Cancel editing topic">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{marginBottom: '1.5rem'}}>
                                <div 
                                    className="entry-topic" 
                                    style={{display: 'inline-block', cursor: 'pointer'}} 
                                    onClick={startEditTopic}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            startEditTopic();
                                        }
                                    }}
                                    aria-label="Click to edit topic"
                                >
                                    {modalEntry.topic}
                                    <span style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginLeft: '0.5rem'}}>✏️</span>
                                </div>
                            </div>
                        )}

                        {/* Quick Summary */}
                        {modalEntry.experienceSummary && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(196, 166, 97, 0.1)',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                borderLeft: '3px solid var(--accent-gold)'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--warm-brown)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Quick Summary
                                </div>
                                <div style={{
                                    color: 'var(--warm-brown)',
                                    lineHeight: '1.6'
                                }}>
                                    {modalEntry.experienceSummary}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-actions-grid">
                            <button 
                                className="action-button" 
                                onClick={startEdit}
                                aria-label="Edit words"
                            >
                                ✏️ Edit Words
                            </button>
                            <button 
                                className="action-button" 
                                onClick={startEditTopic}
                                aria-label="Change topic"
                            >
                                🏷️ Change Topic
                            </button>
                            <button 
                                className="action-button" 
                                onClick={startEditDate}
                                aria-label="Change date"
                            >
                                📅 Change Date
                            </button>
                            <button 
                                className="action-button" 
                                onClick={isEditingStory ? cancelEditStory : startEditStory}
                                aria-label={modalEntry.fullStory ? 'Edit story' : 'Add story'}
                            >
                                {modalEntry.fullStory ? '📖 Edit Story' : '📝 Add Story'}
                            </button>
                        </div>

                        {/* Full Story Section */}
                        {isEditingStory ? (
                            <div className="edit-mode-container">
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                    color: 'var(--warm-brown)',
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {modalEntry.fullStory ? 'Edit Full Story' : 'Add Full Story'}
                                </label>
                                <textarea
                                    value={editStory}
                                    onChange={(e) => setEditStory(e.target.value)}
                                    rows="10"
                                    placeholder="Write the full, detailed version of this experience... Include the context, what happened, what you learned, and why it matters."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        border: '2px solid rgba(196, 166, 97, 0.3)',
                                        borderRadius: '8px',
                                        fontFamily: 'Crimson Pro, serif',
                                        fontSize: '1rem',
                                        background: 'white',
                                        color: 'var(--dark-brown)',
                                        lineHeight: '1.6',
                                        marginBottom: '1rem'
                                    }}
                                    aria-label="Full story text"
                                />
                                <div className="edit-actions">
                                    <button className="btn btn-primary" onClick={saveStory} style={{ flex: 1 }} aria-label="Save story">
                                        Save Story
                                    </button>
                                    <button className="btn-secondary" onClick={cancelEditStory} style={{ flex: 1 }} aria-label="Cancel editing story">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : modalEntry.fullStory ? (
                            <div style={{
                                padding: '1.5rem',
                                background: 'var(--cream)',
                                borderRadius: '8px',
                                lineHeight: '1.8',
                                color: 'var(--warm-brown)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--dark-brown)',
                                    marginBottom: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Full Story
                                </div>
                                {modalEntry.fullStory}
                            </div>
                        ) : (
                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(196, 166, 97, 0.05)',
                                borderRadius: '8px',
                                border: '2px dashed rgba(196, 166, 97, 0.3)',
                                textAlign: 'center',
                                color: 'var(--soft-gray)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }} aria-hidden="true">📖</div>
                                <div style={{ fontSize: '0.9rem' }}>No full story yet</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    Click "Add Story" above to write the detailed version
                                </div>
                            </div>
                        )}

                        {/* Delete Button */}
                        {deleteConfirmId === modalEntry.id ? (
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '1rem'
                            }}>
                                <button
                                    className="action-button danger"
                                    onClick={() => {
                                        deleteEntry(modalEntry.id);
                                        setShowModal(false);
                                    }}
                                    style={{ flex: 1 }}
                                    aria-label="Confirm delete entry"
                                >
                                    ✓ Confirm Delete
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{ flex: 1 }}
                                    aria-label="Cancel delete"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                className="action-button danger"
                                onClick={() => setDeleteConfirmId(modalEntry.id)}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem'
                                }}
                                aria-label="Delete entry"
                            >
                                🗑️ Delete Entry
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

