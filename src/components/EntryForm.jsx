import React from 'react';
import { TOPICS } from '../utils/constants';

export default function EntryForm({
    inputMode,
    setInputMode,
    word1,
    setWord1,
    word2,
    setWord2,
    word3,
    setWord3,
    topic,
    setTopic,
    experienceText,
    setExperienceText,
    experienceDate,
    setExperienceDate,
    isCustomTopic,
    setIsCustomTopic,
    customTopic,
    setCustomTopic,
    suggestedWords,
    isGenerating,
    generateThreeWords,
    handleSubmit
}) {
    return (
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
    );
}

