import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, ListChecks } from 'lucide-react';
import { PriorityBadge } from './Badge';
import Avatar from './Avatar';
import { formatDate, isOverdue } from '../utils/formatDate';

const TaskCard = ({ task, draggable, onDragStart }) => {
  const checklistDone = task.checklist?.filter((c) => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Link
      to={`/tasks/${task._id}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      className="block bg-white rounded-lg border border-gray-100 p-3.5 hover:shadow-md hover:border-gray-200 transition cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-800 leading-snug">{task.title}</h4>
      </div>

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks size={13} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare size={13} />
            {task.commentCount || 0}
          </span>
        </div>
        {task.assignedTo ? (
          <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="sm" />
        ) : (
          <span className="text-[10px] text-gray-300 border border-dashed border-gray-200 rounded-full px-2 py-0.5">
            Unassigned
          </span>
        )}
      </div>
    </Link>
  );
};

export default TaskCard;
