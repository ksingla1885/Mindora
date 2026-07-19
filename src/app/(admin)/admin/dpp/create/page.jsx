'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
    Loader2, ArrowLeft, Save, Plus, Trash2,
    Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, Eye
} from 'lucide-react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL PARSING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert any Excel column header to a canonical key.
 * e.g. "Question Text", "QUESTION TEXT", "question_text" → "question_text"
 */
function toKey(str) {
    return (str || '').toString().toLowerCase().replace(/[\s_\-]+/g, '_').trim();
}

/**
 * Find a value from a row object using multiple possible header names.
 * Returns the first match, or empty string if none.
 */
function getCell(row, ...aliases) {
    const normalizedRow = {};
    for (const k of Object.keys(row)) {
        normalizedRow[toKey(k)] = row[k];
    }
    for (const alias of aliases) {
        const key = toKey(alias);
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== '') {
            return normalizedRow[key].toString().trim();
        }
    }
    return '';
}

/**
 * Convert any type value to one of: MCQ | TRUE_FALSE | SHORT_ANSWER
 */
function parseType(raw) {
    const s = (raw || '').toString().toLowerCase().replace(/[\s_\-\/]+/g, '').trim();
    if (['mcq', 'multiplechoice', 'multiplechoicequestion', 'mc'].includes(s)) return 'MCQ';
    if (['truefalse', 'tf', 'boolean', 'trueorfalse'].includes(s)) return 'TRUE_FALSE';
    if (['shortanswer', 'short', 'oneword', '1word', 'fillintheblanks', 'fillinblank', 'fillintheblank', 'word'].includes(s)) return 'SHORT_ANSWER';
    return null; // unrecognized
}

/**
 * Convert MCQ answer to A/B/C/D regardless of how admin wrote it.
 */
function parseMcqAnswer(raw) {
    const s = (raw || '').toString().toLowerCase().replace(/[\s().]+/g, '').trim();
    const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
                  'optiona': 'A', 'optionb': 'B', 'optionc': 'C', 'optiond': 'D',
                  'choicea': 'A', 'choiceb': 'B', 'choicec': 'C', 'choiced': 'D' };
    return map[s] || null;
}

/**
 * Convert True/False answer to 'true' or 'false'.
 */
function parseTFAnswer(raw) {
    const s = (raw || '').toString().toLowerCase().trim();
    if (['true', 'yes', '1', 't', 'y'].includes(s)) return 'true';
    if (['false', 'no', '0', 'f', 'n'].includes(s)) return 'false';
    return null;
}

/**
 * Parse a single raw row from the Excel sheet into a structured question.
 * Returns { question } on success or { error } on failure.
 */
function parseRow(rawRow, rowNum) {
    // --- Resolve type ---
    const rawType = getCell(rawRow, 'type', 'question type', 'kind', 'q type', 'qtype');
    const type = parseType(rawType);
    if (!type) {
        return { error: `Row ${rowNum}: unrecognized type "${rawType}" — write MCQ, True/False, or Short Answer` };
    }

    // --- Resolve question text ---
    const text = getCell(rawRow, 'question', 'question_text', 'question text', 'text', 'q', 'ques', 'problem', 'statement');
    if (!text) {
        return { error: `Row ${rowNum}: question text is empty` };
    }

    // --- Resolve options (MCQ only) ---
    let options = null;
    if (type === 'MCQ') {
        const a = getCell(rawRow, 'option_a', 'option a', 'a', 'choice a', 'opt a', 'op a', 'option1', 'option 1', '1');
        const b = getCell(rawRow, 'option_b', 'option b', 'b', 'choice b', 'opt b', 'op b', 'option2', 'option 2', '2');
        const c = getCell(rawRow, 'option_c', 'option c', 'c', 'choice c', 'opt c', 'op c', 'option3', 'option 3', '3');
        const d = getCell(rawRow, 'option_d', 'option d', 'd', 'choice d', 'opt d', 'op d', 'option4', 'option 4', '4');
        if (!a || !b) {
            return { error: `Row ${rowNum}: MCQ needs at least Option A and Option B` };
        }
        options = { A: a, B: b, C: c, D: d };
    }

    // --- Resolve correct answer ---
    const rawAnswer = getCell(rawRow, 'correct_answer', 'correct answer', 'answer', 'ans', 'key', 'solution', 'correct');
    let correctAnswer = '';

    if (type === 'MCQ') {
        correctAnswer = parseMcqAnswer(rawAnswer);
        if (!correctAnswer) {
            return { error: `Row ${rowNum}: MCQ answer "${rawAnswer}" not recognized — use A, B, C, D (or 1, 2, 3, 4)` };
        }
    } else if (type === 'TRUE_FALSE') {
        correctAnswer = parseTFAnswer(rawAnswer);
        if (!correctAnswer) {
            return { error: `Row ${rowNum}: True/False answer "${rawAnswer}" not recognized — use True or False` };
        }
    } else {
        correctAnswer = rawAnswer;
        if (!correctAnswer) {
            return { error: `Row ${rowNum}: Short Answer correct answer is empty` };
        }
    }

    // --- Resolve explanation (optional) ---
    const explanation = getCell(rawRow, 'explanation', 'explain', 'reason', 'hint', 'solution detail', 'note');

    return {
        question: {
            id: Math.random().toString(36).substr(2, 9),
            type,
            text,
            options,
            correctAnswer,
            explanation,
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPLOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────

function BulkUploadModal({ onClose, onImport }) {
    const fileInputRef = useRef(null);
    const [validQuestions, setValidQuestions] = useState([]);
    const [errors, setErrors] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [fileName, setFileName] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        setValidQuestions([]);
        setErrors([]);
        setTotalRows(0);

        try {
            const xlsxModule = await import('xlsx');
            const XLSX = xlsxModule.default ?? xlsxModule;

            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

            setTotalRows(rows.length);

            const good = [];
            const bad = [];

            rows.forEach((row, i) => {
                const result = parseRow(row, i + 1);
                if (result.error) bad.push(result.error);
                else good.push(result.question);
            });

            setValidQuestions(good);
            setErrors(bad);
        } catch (err) {
            console.error(err);
            toast.error('Could not read file — make sure it is a valid .xlsx or .csv');
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = () => {
        if (validQuestions.length === 0) { toast.error('No valid questions to import'); return; }
        onImport(validQuestions);
        onClose();
        toast.success(`${validQuestions.length} question${validQuestions.length !== 1 ? 's' : ''} imported!`);
    };

    const TYPE_BADGE = {
        MCQ: 'bg-blue-100 text-blue-700',
        TRUE_FALSE: 'bg-purple-100 text-purple-700',
        SHORT_ANSWER: 'bg-amber-100 text-amber-700',
    };
    const TYPE_LABEL = { MCQ: 'MCQ', TRUE_FALSE: 'T/F', SHORT_ANSWER: 'Short' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Bulk Upload Questions</h2>
                            <p className="text-xs text-muted-foreground">Upload your Excel or CSV file</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Format guide */}
                    <div className="rounded-xl border border-border overflow-hidden text-xs">
                        <div className="px-4 py-2 bg-muted/40 border-b border-border font-semibold text-muted-foreground uppercase tracking-wider">
                            Required Columns in your Excel
                        </div>
                        <div className="p-4 space-y-2 text-muted-foreground">
                            <p><span className="font-semibold text-foreground">Type</span> — write: <code className="bg-muted px-1 rounded">MCQ</code> · <code className="bg-muted px-1 rounded">True/False</code> · <code className="bg-muted px-1 rounded">Short Answer</code></p>
                            <p><span className="font-semibold text-foreground">Question</span> (or Question Text, Question_Text) — the question</p>
                            <p><span className="font-semibold text-foreground">Option A, Option B, Option C, Option D</span> — for MCQ only</p>
                            <p><span className="font-semibold text-foreground">Answer</span> (or Correct Answer) — <code className="bg-muted px-1 rounded">A/B/C/D</code> or <code className="bg-muted px-1 rounded">1/2/3/4</code> for MCQ · <code className="bg-muted px-1 rounded">True/False</code> for T/F · word for Short Answer</p>
                            <p><span className="font-semibold text-foreground">Explanation</span> — optional</p>
                        </div>
                    </div>

                    {/* Upload zone */}
                    <div
                        className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-primary/5 transition-all p-8 text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isParsing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Reading file…</p>
                            </div>
                        ) : fileName ? (
                            <div className="flex flex-col items-center gap-1">
                                <FileSpreadsheet className="h-8 w-8 text-primary" />
                                <p className="text-sm font-semibold">{fileName}</p>
                                <p className="text-xs text-muted-foreground">Click to choose a different file</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-semibold">Click to upload (.xlsx or .csv)</p>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {errors.length} row{errors.length !== 1 ? 's' : ''} skipped
                            </div>
                            <ul className="space-y-0.5 pl-6 list-disc">
                                {errors.map((err, i) => (
                                    <li key={i} className="text-xs text-amber-600">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Preview */}
                    {validQuestions.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Eye className="h-4 w-4 text-primary" />
                                {validQuestions.length} question{validQuestions.length !== 1 ? 's' : ''} ready to import
                            </div>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="overflow-x-auto max-h-56">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-muted/90">
                                            <tr className="border-b border-border">
                                                <th className="px-3 py-2 text-left text-muted-foreground w-8">#</th>
                                                <th className="px-3 py-2 text-left text-muted-foreground w-20">Type</th>
                                                <th className="px-3 py-2 text-left text-muted-foreground">Question</th>
                                                <th className="px-3 py-2 text-left text-muted-foreground w-20">Answer</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {validQuestions.map((q, i) => (
                                                <tr key={q.id} className="hover:bg-muted/20">
                                                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${TYPE_BADGE[q.type]}`}>
                                                            {TYPE_LABEL[q.type]}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 max-w-xs truncate" title={q.text}>{q.text}</td>
                                                    <td className="px-3 py-2 font-mono font-bold text-emerald-600">{q.correctAnswer}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-border shrink-0 bg-muted/10">
                    <p className="text-xs text-muted-foreground">
                        {totalRows > 0 && (
                            <>
                                <span className="text-emerald-600 font-semibold">{validQuestions.length} valid</span>
                                {errors.length > 0 && <span className="text-amber-600 font-semibold"> · {errors.length} skipped</span>}
                                <span> of {totalRows} rows</span>
                            </>
                        )}
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={handleImport}
                            disabled={validQuestions.length === 0}
                            className="gap-2 bg-primary text-white font-bold"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Import {validQuestions.length > 0 ? `${validQuestions.length} Question${validQuestions.length !== 1 ? 's' : ''}` : ''}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION FORM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const createNewQuestion = () => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'MCQ',
    text: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateDPPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dppId = searchParams.get('id');
    const isEditMode = !!dppId;

    const [isLoading, setIsLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('12');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [questions, setQuestions] = useState([createNewQuestion()]);

    useEffect(() => { fetchSubjects(selectedClass); }, [selectedClass]);
    useEffect(() => { if (dppId) fetchDPPDetails(dppId); }, [dppId]);

    const fetchDPPDetails = async (id) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/dpp/${id}`);
            if (!res.ok) throw new Error('Failed to fetch DPP details');
            const data = await res.json();
            setDate(new Date(data.date).toISOString().split('T')[0]);
            setSelectedClass(data.class);
            setSelectedSubject(data.subjectId);
            const typeMap = { mcq: 'MCQ', true_false: 'TRUE_FALSE', short_answer: 'SHORT_ANSWER' };
            const mapped = data.questions.map(qItem => {
                const q = qItem.question;
                return {
                    id: q.id,
                    type: typeMap[q.type] || 'MCQ',
                    text: q.text,
                    options: q.options || { A: '', B: '', C: '', D: '' },
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || '',
                };
            });
            if (mapped.length > 0) setQuestions(mapped);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load DPP details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubjects = async (className) => {
        try {
            const res = await fetch(`/api/admin/subjects?class=${className}`);
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
                setSelectedSubject(data.length > 0 ? data[0].id : '');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'type') {
            if (value === 'MCQ') { updated[index].options = { A: '', B: '', C: '', D: '' }; updated[index].correctAnswer = 'A'; }
            else if (value === 'TRUE_FALSE') { updated[index].options = null; updated[index].correctAnswer = 'true'; }
            else { updated[index].options = null; updated[index].correctAnswer = ''; }
        }
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex, key, value) => {
        const updated = [...questions];
        updated[qIndex].options = { ...updated[qIndex].options, [key]: value };
        setQuestions(updated);
    };

    const addQuestion = () => setQuestions([...questions, createNewQuestion()]);

    const removeQuestion = (index) => {
        if (questions.length === 1) { toast.error('At least one question is required'); return; }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleBulkImport = (imported) => {
        setQuestions(prev => {
            const onlyEmpty = prev.length === 1 && !prev[0].text.trim();
            return onlyEmpty ? imported : [...prev, ...imported];
        });
    };

    const handleSubmit = async () => {
        if (!selectedSubject) { toast.error('Please select a subject'); return; }
        if (!questions[0].text) { toast.error('Please fill in at least the first question'); return; }
        try {
            setIsLoading(true);
            const payload = {
                date, class: selectedClass, subjectId: selectedSubject,
                questions: questions.filter(q => q.text.trim() !== ''),
            };
            const url = isEditMode ? `/api/admin/dpp/${dppId}` : '/api/admin/dpp';
            const method = isEditMode ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Failed');
            toast.success(isEditMode ? 'DPP updated!' : 'DPP created!');
            router.push('/admin/dpp');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save DPP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {showBulkUpload && (
                <BulkUploadModal onClose={() => setShowBulkUpload(false)} onImport={handleBulkImport} />
            )}

            <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-20">

                {/* Top bar */}
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b border-border">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dpp">
                            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{isEditMode ? 'Edit DPP' : 'Create New DPP'}</h2>
                            <p className="text-sm text-muted-foreground">{isEditMode ? 'Modify existing practice questions.' : 'Add practice questions for students.'}</p>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary text-white font-bold shadow-lg shadow-primary/20">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Update DPP' : 'Save DPP'}
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* DPP Details */}
                    <Card className="border-border bg-card">
                        <CardHeader><CardTitle>DPP Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Class</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="9">Class 9</SelectItem>
                                        <SelectItem value="10">Class 10</SelectItem>
                                        <SelectItem value="11">Class 11</SelectItem>
                                        <SelectItem value="12">Class 12</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xl font-bold">Questions ({questions.length})</h3>
                            <div className="flex gap-2">
                                <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary">
                                    <Upload className="h-4 w-4" /> Upload Excel
                                </Button>
                                <Button onClick={addQuestion} variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Question
                                </Button>
                            </div>
                        </div>

                        {questions.map((question, index) => (
                            <Card key={question.id} className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30 border-b border-border">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">{index + 1}</span>
                                        Question {index + 1}
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${question.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : question.type === 'TRUE_FALSE' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {question.type === 'TRUE_FALSE' ? 'True/False' : question.type === 'SHORT_ANSWER' ? 'Short Answer' : 'MCQ'}
                                        </span>
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-sm font-medium">Question Text</label>
                                            <Textarea placeholder="Enter question text..." value={question.text} onChange={e => handleQuestionChange(index, 'text', e.target.value)} className="min-h-[80px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Type</label>
                                            <Select value={question.type} onValueChange={val => handleQuestionChange(index, 'type', val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MCQ">MCQ</SelectItem>
                                                    <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                                    <SelectItem value="SHORT_ANSWER">Short Answer (1 Word)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {question.type === 'MCQ' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {['A', 'B', 'C', 'D'].map(opt => (
                                                <div key={opt} className="space-y-2">
                                                    <label className="text-xs font-bold text-muted-foreground">Option {opt}</label>
                                                    <Input
                                                        placeholder={`Option ${opt} text`}
                                                        value={question.options?.[opt] || ''}
                                                        onChange={e => handleOptionChange(index, opt, e.target.value)}
                                                        className={question.correctAnswer === opt ? 'border-emerald-500 ring-1 ring-emerald-500/20' : ''}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-emerald-600">Correct Answer</label>
                                            {question.type === 'MCQ' && (
                                                <Select value={question.correctAnswer} onValueChange={val => handleQuestionChange(index, 'correctAnswer', val)}>
                                                    <SelectTrigger className="border-emerald-200 bg-emerald-50/50"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A">Option A</SelectItem>
                                                        <SelectItem value="B">Option B</SelectItem>
                                                        <SelectItem value="C">Option C</SelectItem>
                                                        <SelectItem value="D">Option D</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {question.type === 'TRUE_FALSE' && (
                                                <Select value={question.correctAnswer} onValueChange={val => handleQuestionChange(index, 'correctAnswer', val)}>
                                                    <SelectTrigger className="border-emerald-200 bg-emerald-50/50"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {question.type === 'SHORT_ANSWER' && (
                                                <Input placeholder="Enter the correct answer" value={question.correctAnswer} onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)} className="border-emerald-200 bg-emerald-50/50" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Explanation</label>
                                            <Textarea placeholder="Explain the solution..." value={question.explanation} onChange={e => handleQuestionChange(index, 'explanation', e.target.value)} className="min-h-[80px]" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Button onClick={addQuestion} variant="outline" className="w-full py-8 border-dashed border-2 hover:border-primary/50 text-muted-foreground hover:text-primary gap-2">
                            <Plus className="h-5 w-5" /> Add Another Question
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
