import React, { useState, useEffect } from 'react';
import { TodoProvider, useTodo } from './context/TodoContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider, useTranslation } from './i18n';
import { FallingItemsProvider, FallingItemsLayer } from './components/ui/FallingItems';
import { Dashboard } from './pages/Dashboard';
import { TodoList } from './pages/TodoList';
import { AddTodo } from './pages/AddTodo';
import { EditTodo } from './pages/EditTodo';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { SyncDialog } from './components/sync/SyncDialog';
import { Home, List, TrendingUp, Settings as SettingsIcon, Plus } from 'lucide-react';
import { initTheme } from './lib/theme';
import type { Todo } from './types/todo';

type TabType = 'dashboard' | 'todos' | 'statistics' | 'settings';

function InnerAppContent() {
  // useTodo 必须在 TodoProvider 内部 — 拆到 Inner 子组件
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { state, dispatch, importTodos } = useTodo();
  const existingCount = state.todos.length;

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    const handleEditTodo = () => setShowEditModal(true);
    window.addEventListener('edit-todo', handleEditTodo);
    return () => window.removeEventListener('edit-todo', handleEditTodo);
  }, []);

  const handleSyncMerge = (incoming: Todo[]) => {
    importTodos(incoming);
    return { added: incoming.length, existing: existingCount };
  };
  const handleSyncReplace = (incoming: Todo[]) => {
    dispatch({ type: 'LOAD_TODOS', payload: incoming });
  };
  const handleSyncDiscard = () => {};

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'todos':
        return <TodoList />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-mint-50">
      <main className="pb-20">
        {renderContent()}
      </main>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed top-4 right-16 z-40 w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-peach-400 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Plus className="w-5 h-5" />
      </button>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showAddModal && <AddTodo onClose={() => setShowAddModal(false)} />}
      {showEditModal && <EditTodo onClose={() => setShowEditModal(false)} />}

      <SyncDialog
        onMerge={handleSyncMerge}
        onReplace={handleSyncReplace}
        onDiscard={handleSyncDiscard}
        existingCount={existingCount}
      />

      <FallingItemsLayer />
    </div>
  );
}

function BottomNav({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (t: TabType) => void }) {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-100 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center py-2 px-2">
        <NavButton icon={<Home className="w-5 h-5" />} label={t('nav.dashboard')} active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} />
        <NavButton icon={<List className="w-5 h-5" />} label={t('nav.todos')} active={activeTab === 'todos'} onClick={() => onTabChange('todos')} />
        <NavButton icon={<TrendingUp className="w-5 h-5" />} label={t('nav.statistics')} active={activeTab === 'statistics'} onClick={() => onTabChange('statistics')} />
        <NavButton icon={<SettingsIcon className="w-5 h-5" />} label={t('nav.settings')} active={activeTab === 'settings'} onClick={() => onTabChange('settings')} />
      </div>
    </nav>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 relative ${
        active ? 'text-pink-500 bg-pink-50' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
      {active && (
        <div className="absolute bottom-0 w-6 h-1 bg-gradient-to-r from-pink-400 to-peach-400 rounded-full" />
      )}
    </button>
  );
}

function App() {
  // I18nProvider 在最外层
  return (
    <I18nProvider>
      <ThemeProvider>
        <TodoProvider>
          <FallingItemsProvider>
            <InnerAppContent />
          </FallingItemsProvider>
        </TodoProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
