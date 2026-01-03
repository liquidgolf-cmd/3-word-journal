import React, { useState } from 'react';

export default function EntryForm({
    inputMode,
    setInputMode,
    word1,
    setWord1,
    word2,
    setWord2,
    word3,
    setWord3,
    experienceText,
    setExperienceText,
    experienceDate,
    setExperienceDate,
    suggestedWords,
    isGenerating,
    generateThreeWords,
    handleSubmit
}) {
    const [draggedWord, setDraggedWord] = useState(null);
    const [dragOverInput, setDragOverInput] = useState(null);

    const handleDragStart = (e, word) => {
        setDraggedWord(word);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', word);
        // Add visual feedback
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedWord(null);
        setDragOverInput(null);
    };

    const handleDragOver = (e, inputIndex) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverInput(inputIndex);
    };

    const handleDragLeave = (e) => {
        // Only clear if we're actually leaving the input (not just moving to a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverInput(null);
        }
    };

    const handleDrop = (e, inputIndex, setWord) => {
        e.preventDefault();
        const word = e.dataTransfer.getData('text/plain') || draggedWord;
        if (word) {
            setWord(word);
        }
        setDragOverInput(null);
        setDraggedWord(null);
    };

    const handleWordClick = (word) => {
        // Find the first empty input or cycle through inputs
        if (!word1) {
            setWord1(word);
        } else if (!word2) {
            setWord2(word);
        } else if (!word3) {
            setWord3(word);
        } else {
            // All filled, replace word1
            setWord1(word);
        }
    };
    return (
        <form onSubmit={handleSubmit}>
                {/* 1. Describe Your Experience */}
                {inputMode === 'ai' ? (
                    <div className="form-group">
                        <label htmlFor="experience-text">Describe Your Experience *</label>
                        <textarea
                            id="experience-text"
                            placeholder="Tell me about what happened... I'll help you distill it into three words."
                            value={experienceText}
                            onChange={(e) => setExperienceText(e.target.value)}
                            rows="4"
                            required
                            aria-label="Describe your experience for AI word generation (required)"
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label htmlFor="experience-summary">Describe Your Experience *</label>
                        <textarea
                            id="experience-summary"
                            placeholder="Quick summary of what happened..."
                            value={experienceText}
                            onChange={(e) => setExperienceText(e.target.value)}
                            rows="4"
                            required
                            aria-label="Experience summary (required)"
                        />
                        <div style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginTop: '0.5rem', fontStyle: 'italic'}}>
                            You can add the full detailed story later
                        </div>
                    </div>
                )}

                {/* 2. When Did This Happen? */}
                <div className="form-group">
                    <label htmlFor="experience-date">When Did This Happen? *</label>
                    <input
                        id="experience-date"
                        type="date"
                        value={experienceDate}
                        onChange={(e) => setExperienceDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        aria-label="Date when the experience happened (required)"
                    />
                </div>

                {/* 3. Entry Mode */}
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

                {/* 4. Three Words */}
                {inputMode === 'ai' ? (
                    <>
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
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, word)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => handleWordClick(word)}
                                            style={{ cursor: 'grab' }}
                                            title="Click to fill next empty input, or drag to specific input box"
                                        >
                                            {word}
                                        </div>
                                    ))}
                                </div>
                                <div className="suggestion-info">
                                    Click words to fill inputs, or drag words to specific input boxes below
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
                                    onDragOver={(e) => handleDragOver(e, 1)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 1, setWord1)}
                                    maxLength="20"
                                    className={dragOverInput === 1 ? 'drag-over' : ''}
                                    aria-label="First word - drag and drop suggested words here"
                                />
                                <input
                                    type="text"
                                    placeholder="Word 2"
                                    value={word2}
                                    onChange={(e) => setWord2(e.target.value)}
                                    onDragOver={(e) => handleDragOver(e, 2)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 2, setWord2)}
                                    maxLength="20"
                                    className={dragOverInput === 2 ? 'drag-over' : ''}
                                    aria-label="Second word - drag and drop suggested words here"
                                />
                                <input
                                    type="text"
                                    placeholder="Word 3"
                                    value={word3}
                                    onChange={(e) => setWord3(e.target.value)}
                                    onDragOver={(e) => handleDragOver(e, 3)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 3, setWord3)}
                                    maxLength="20"
                                    className={dragOverInput === 3 ? 'drag-over' : ''}
                                    aria-label="Third word - drag and drop suggested words here"
                                />
                            </div>
                        </div>
                    </>
                ) : (
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
                )}
        </form>
    );
}

