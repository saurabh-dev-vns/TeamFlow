import React, { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'Todo', label: 'To Do', color: 'bg-gray-400' },
  { key: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'Completed', label: 'Completed', color: 'bg-green-500' },
];

const KanbanBoard = ({ tasks, onStatusChange, canDrag }) => {
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.setData('currentStatus', task.status);
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (taskId && currentStatus !== columnKey) {
      onStatusChange(taskId, columnKey);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className={`flex-shrink-0 w-[280px] md:w-[300px] rounded-xl bg-gray-50 border border-gray-100 transition ${
              dragOverCol === col.key ? 'ring-2 ring-primary-300' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center gap-2 px-4 py-3 sticky top-0">
              <span className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-1.5">
                {colTasks.length}
              </span>
            </div>
            <div className="px-3 pb-3 space-y-2.5 min-h-[100px]">
              {colTasks.map((task) => (
                <TaskCard key={task._id} task={task} draggable={canDrag(task)} onDragStart={handleDragStart} />
              ))}
              {colTasks.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-6">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
