import { useEffect } from 'react';
import useTreeStore from '../store/treeStore';

export function useTreeData() {
  const store = useTreeStore();

  useEffect(() => {
    store.fetchTree();
    store.fetchFlatMembers();
  }, []);

  return store;
}
