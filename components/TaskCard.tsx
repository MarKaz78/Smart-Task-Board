
import React from 'react';
import { Task, TaskColor } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  isDragging: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  onDragStart, 
  onDragEnter, 
  onDragEnd, 
  onDelete, 
  onEdit,
  isDragging 
}) => {
  const priorityColors = {
    low: 'bg-slate-200 text-slate-700',
    medium: 'bg-blue-200 text-blue-700',
    high: 'bg-red-200 text-red-700'
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`
        relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-move group
        ${task.color} ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-lg hover:-translate-y-1'}
        flex flex-col h-full min-h-[160px]
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-black/5 rounded"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-black/5 rounded text-rose-600"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 leading-tight">{task.title}</h3>
      <p className="text-sm opacity-80 line-clamp-3 mb-4 flex-grow">
        {task.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-1">
          <div className="w-6 h-6 rounded-full bg-white/50 border border-white/80 flex items-center justify-center">
             <span className="text-[10px]">✨</span>
          </div>
        </div>
        <span className="text-[10px] opacity-50 italic">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
