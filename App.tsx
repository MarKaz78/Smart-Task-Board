
import React, { useState, useEffect } from 'react';
import { Task, TaskColor } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import { organizeTasksWithAI } from './services/geminiService';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Drag and Drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('tasks')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (sbError) throw sbError;

      const mappedTasks: Task[] = (data || []).map(d => ({
        ...d,
        createdAt: d.created_at || d.createdAt
      }));
      setTasks(mappedTasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError('Nie udało się połączyć z Supabase. Sprawdź konfigurację tabeli "tasks".');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedItemIndex !== null && dragOverIndex !== null) {
      const newTasks = [...tasks];
      const draggedItem = newTasks[draggedItemIndex];
      newTasks.splice(draggedItemIndex, 1);
      newTasks.splice(dragOverIndex, 0, draggedItem);
      
      const updatedTasks = newTasks.map((t, idx) => ({ ...t, order_index: idx }));
      setTasks(updatedTasks);
      
      setSyncing(true);
      const { error: sbError } = await supabase.from('tasks').upsert(
        updatedTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          color: t.color,
          priority: t.priority,
          created_at: t.createdAt,
          order_index: t.order_index
        }))
      );
      if (sbError) setError('Błąd podczas zapisywania kolejności.');
      setSyncing(false);
    }
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleDeleteTask = async (id: string) => {
    setSyncing(true);
    const { error: sbError } = await supabase.from('tasks').delete().eq('id', id);
    if (!sbError) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      setError('Nie udało się usunąć zadania.');
    }
    setSyncing(false);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    setSyncing(true);
    try {
      if (editingTask) {
        const updatedTask = { ...editingTask, ...taskData };
        const { error: sbError } = await supabase
          .from('tasks')
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            color: updatedTask.color
          })
          .eq('id', editingTask.id);
        
        if (sbError) throw sbError;
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      } else {
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: taskData.title || 'Untitled',
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          color: taskData.color || TaskColor.BLUE,
          createdAt: Date.now(),
          order_index: tasks.length
        };
        
        const { error: sbError } = await supabase.from('tasks').insert({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          color: newTask.color,
          created_at: newTask.createdAt,
          order_index: newTask.order_index
        });
        
        if (sbError) throw sbError;
        setTasks(prev => [...prev, newTask]);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      setError('Błąd podczas zapisywania danych w Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  const handleMagicOrganize = async () => {
    if (tasks.length < 2) return;
    setIsAILoading(true);
    try {
      const sortedIds = await organizeTasksWithAI(tasks);
      const sortedTasks = [...tasks].sort((a, b) => {
        const indexA = sortedIds.indexOf(a.id);
        const indexB = sortedIds.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }).map((t, idx) => ({ ...t, order_index: idx }));

      setTasks(sortedTasks);
      
      const { error: sbError } = await supabase.from('tasks').upsert(
        sortedTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          color: t.color,
          priority: t.priority,
          created_at: t.createdAt,
          order_index: t.order_index
        }))
      );
      if (sbError) throw sbError;
    } catch (err) {
      setError('AI uporządkowało zadania, ale nie udało się zapisać nowej kolejności.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ZenPriority</h1>
              <div className="flex gap-2 items-center">
                {syncing && <span className="text-[10px] text-indigo-500 animate-pulse font-medium">Synchronizacja...</span>}
                {error && <span className="text-[10px] text-rose-500 font-bold">Błąd połączenia</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMagicOrganize}
              disabled={isAILoading || tasks.length < 2}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {isAILoading ? (
                <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
              ) : "Smart Sort"}
            </button>
            <button 
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Add Task
            </button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">×</button>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Twoje zadania, <span className="text-indigo-600">zawsze w chmurze.</span>
        </h2>
        <p className="text-slate-500 max-w-2xl text-lg">
          Dane są synchronizowane z Supabase w czasie rzeczywistym.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Brak zadań</h3>
            <p className="text-slate-500 mb-6">Dodaj pierwsze zadanie, aby rozpocząć.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
            >
              Create New Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                isDragging={draggedItemIndex === index}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                onDelete={handleDeleteTask}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />
    </div>
  );
};

export default App;
