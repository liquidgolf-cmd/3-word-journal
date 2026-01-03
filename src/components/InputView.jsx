import { useState, useEffect } from 'react';
import EntryForm from './EntryForm';
import TagInput from './TagInput';
import { generateTitle } from '../utils/helpers';

export default function InputView({
    entries,
    setEntries,
    editingEntry,
    setEditingEntry,
    onSaveComplete,
    generateThreeWords,
    isGenerating,
    suggestedWords: externalSuggestedWords,
    experienceText: externalExperienceText,
    setExperienceText: setExternalExperienceText,
    setError,
    setSuccessMessage
}) {
    const [word1, setWord1] = useState('');
    const [word2, setWord2] = useState('');
    const [word3, setWord3] = useState('');
    const [tags, setTags] = useState([]);
    const [fullStory, setFullStory] = useState('');
    const [experienceText, setExperienceText] = useState(externalExperienceText || '');
    const [experienceDate, setExperienceDate] = useState('');
    const [inputMode, setInputMode] = useState('manual');

    // Get all existing tags for autocomplete
    const allExistingTags = Array.from(new Set(
        entries.flatMap(entry => entry.tags || [])
    )).filter(Boolean);

    // Use external suggested words if provided, otherwise use local state
    const suggestedWords = externalSuggestedWords || [];

    // Sync experienceText with external state
    useEffect(() => {
        if (externalExperienceText !== undefined && externalExperienceText !== experienceText) {
            setExperienceText(externalExperienceText);
        }
    }, [externalExperienceText]);

    // Update external experienceText when local changes
    const handleExperienceTextChange = (value) => {
        setExperienceText(value);
        if (setExternalExperienceText) {
            setExternalExperienceText(value);
        }
    };

    // Pre-fill form when editing
    useEffect(() => {
        if (editingEntry) {
            setWord1(editingEntry.words[0] || '');
            setWord2(editingEntry.words[1] || '');
            setWord3(editingEntry.words[2] || '');
            setTags(editingEntry.tags || []);
            setFullStory(editingEntry.fullStory || '');
            setExperienceText(editingEntry.experienceSummary || '');
            setExperienceDate(editingEntry.experienceDate ? editingEntry.experienceDate.split('T')[0] : '');
            setInputMode('manual');
        } else {
            // Reset form for new entry
            setWord1('');
            setWord2('');
            setWord3('');
            setTags([]);
            setFullStory('');
            setExperienceText('');
            setExperienceDate('');
            setInputMode('manual');
        }
    }, [editingEntry]);
    
    // Generate title when experienceText changes (for new entries)
    useEffect(() => {
        if (!editingEntry && experienceText) {
            // Title will be generated on submit, but we can preview it here if needed
        }
    }, [experienceText, editingEntry]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        // Only require experienceText and experienceDate
        if (!experienceText || !experienceText.trim()) {
            setError('Please describe your experience');
            setTimeout(() => setError(null), 3000);
            return;
        }
        
        if (!experienceDate) {
            setError('Please select a date');
            setTimeout(() => setError(null), 3000);
            return;
        }

        // Generate title from experience text
        const title = generateTitle(experienceText);
        
        // Use provided words or empty strings if not provided
        const entryWords = [
            word1 || '',
            word2 || '',
            word3 || ''
        ];

        if (editingEntry) {
            // Update existing entry
            const updatedEntries = entries.map(entry => 
                entry.id === editingEntry.id
                    ? {
                        ...entry,
                        title: title,
                        words: entryWords,
                        tags: tags,
                        experienceSummary: experienceText,
                        fullStory: fullStory,
                        experienceDate: experienceDate || new Date().toISOString()
                    }
                    : entry
            );
            setEntries(updatedEntries);
            setSuccessMessage('Entry updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            setEditingEntry(null);
            if (onSaveComplete) {
                onSaveComplete();
            }
        } else {
            // Create new entry
            const newEntry = {
                id: Date.now(),
                title: title,
                words: entryWords,
                tags: tags,
                experienceSummary: experienceText,
                fullStory: '',
                date: new Date().toISOString(),
                experienceDate: experienceDate || new Date().toISOString()
            };

            setEntries([newEntry, ...entries]);
            setSuccessMessage('Entry saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        
        // Reset form
        setWord1('');
        setWord2('');
        setWord3('');
        setTags([]);
        setFullStory('');
        setExperienceText('');
        setExperienceDate('');
        setInputMode('manual');
    };

    return (
        <div className="input-view">
            <div className="quick-entry-card">
                <form onSubmit={handleSubmit}>
                    <EntryForm
                        inputMode={inputMode}
                        setInputMode={setInputMode}
                        word1={word1}
                        setWord1={setWord1}
                        word2={word2}
                        setWord2={setWord2}
                        word3={word3}
                        setWord3={setWord3}
                        experienceText={experienceText}
                        setExperienceText={handleExperienceTextChange}
                        experienceDate={experienceDate}
                        setExperienceDate={setExperienceDate}
                        suggestedWords={suggestedWords}
                        isGenerating={isGenerating}
                        generateThreeWords={generateThreeWords}
                        handleSubmit={handleSubmit}
                    />

                    <div className="form-group">
                        <label htmlFor="tags-input">Tags</label>
                        <TagInput
                            tags={tags}
                            onChange={setTags}
                            placeholder="Add tags (comma-separated, e.g., Work, Meeting, Important)"
                            existingTags={allExistingTags}
                        />
                        <div style={{fontSize: '0.85rem', color: 'var(--soft-gray)', marginTop: '0.5rem', fontStyle: 'italic'}}>
                            Add multiple tags to categorize your entry
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        aria-label={editingEntry ? "Update journal entry" : "Save new journal entry"}
                    >
                        {editingEntry ? 'Update Entry' : 'Save Entry'}
                    </button>
                    {editingEntry && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setEditingEntry(null);
                                if (onSaveComplete) {
                                    onSaveComplete();
                                }
                            }}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Cancel Edit
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

