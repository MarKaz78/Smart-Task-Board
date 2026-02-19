
import React, { useState, useEffect } from 'react';
import { Task, TaskColor } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
        createdAt: Number(d.created_at || d.createdAt)
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
          description: t.description || '',
          color: t.color,
          priority: t.priority,
          created_at: Number(t.createdAt),
          order_index: Number(t.order_index)
        }))
      );
      if (sbError) {
        console.error('Upsert error:', sbError);
        setError('Błąd podczas zapisywania kolejności.');
      }
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
      console.error('Delete error:', sbError);
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
    } catch (err: any) {
      console.error('Save error:', err);
      setError('Błąd podczas zapisywania danych w Supabase.');
    } finally {
      setSyncing(false);
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
                {error && <span className="text-[10px] text-rose-500 font-bold">Błąd</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                title="List View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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
            <button onClick={() => setError(null)} className="font-bold text-lg leading-none">×</button>
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
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "flex flex-col gap-4 max-w-4xl mx-auto"
          }>
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
                viewMode={viewMode}
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
