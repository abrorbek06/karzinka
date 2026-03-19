'use client';

import { Order, OrderStatus } from '@/types/orders';
import { OrderCard } from './OrderCard';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  status: OrderStatus | 'today';
  statusLabel: string;
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: OrderStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  colorClass: string;
  droppable?: boolean;
  emptyLabel?: string;

  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function KanbanColumn({
  status,
  statusLabel,
  orders,
  onOrderClick,
  onDragStart,
  onDrop,
  onDragOver,
  colorClass,
  droppable = true,
  emptyLabel = "Buyurtmalar yo'q",
  showAddButton = false,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full bg-slate-700 rounded-lg p-4 min-w-80">
      
      {/* HEADER */}
      <div className={`mb-4 pb-3 border-b-2 ${colorClass}`}>
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <h2 className="text-lg font-bold text-white">
              {statusLabel}
            </h2>

            {showAddButton && (
              <Button
                size="icon"
                className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={onAddClick}
              >
                +
              </Button>
            )}


          </div>

          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-700 text-sm font-semibold rounded-full">
            {orders.length}
          </span>

        </div>
      </div>

      {/* ORDERS LIST */}
      <div
        onDragOver={droppable ? onDragOver : undefined}
        onDrop={droppable && status !== 'today' ? (e) => onDrop(e, status) : undefined}
        className="flex-1 space-y-3 overflow-y-auto pb-4"
      >
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-center">{emptyLabel}</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onDragStart={(e) => onDragStart(e, order.id)}
            >
              <OrderCard
                order={order}
                onClick={() => onOrderClick(order)}
                draggable
              />
            </div>
          ))
        )}
      </div>

    </div>
  );
}