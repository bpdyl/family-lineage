import { useCallback } from 'react';
import FamilyTree from '../components/tree/FamilyTree';
import SearchPanel from '../components/panels/SearchPanel';
import EditPanel from '../components/panels/EditPanel';
import useTreeStore from '../store/treeStore';
import { useTreeData } from '../hooks/useTreeData';

export default function TreePage() {
  const { treeData, selectedNode, loading } = useTreeData();
  const clearSelection = useTreeStore(s => s.clearSelection);

  const handleNodeSelect = useCallback((node) => {
    // node is already set in store by FamilyTree
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Search bar */}
      <div className="absolute top-4 left-4 z-20 w-72">
        <SearchPanel />
      </div>

      {/* Tree */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--color-text-muted)]">Loading family tree...</p>
              <p className="text-xs font-nepali text-[var(--color-text-muted)] mt-1">वंशवृक्ष लोड हुँदैछ...</p>
            </div>
          </div>
        ) : (
          <FamilyTree onNodeSelect={handleNodeSelect} />
        )}
      </div>

      {/* Edit/Detail Panel */}
      {selectedNode && (
        <EditPanel member={selectedNode} onClose={clearSelection} />
      )}
    </div>
  );
}
