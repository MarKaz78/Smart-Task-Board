
export interface Task {
  id: string;
  title: string;
  description: string;
  color: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  order_index: number;
}

export enum TaskColor {
  BLUE = 'bg-blue-50 border-blue-200 text-blue-900',
  GREEN = 'bg-green-50 border-green-200 text-green-900',
  AMBER = 'bg-amber-50 border-amber-200 text-amber-900',
  ROSE = 'bg-rose-50 border-rose-200 text-rose-900',
  INDIGO = 'bg-indigo-50 border-indigo-200 text-indigo-900',
  PURPLE = 'bg-purple-50 border-purple-200 text-purple-900'
}
