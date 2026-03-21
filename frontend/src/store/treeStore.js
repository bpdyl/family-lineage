import { create } from 'zustand';
import api from '../services/api';

const useTreeStore = create((set, get) => ({
  treeData: null,
  flatMembers: [],
  selectedNode: null,
  highlightedPath: [],
  expandedNodes: new Set(),
  searchResults: [],
  searchQuery: '',
  loading: false,
  error: null,

  fetchTree: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/tree');
      const expanded = new Set();
      collectIds(data, expanded, 2);
      set({ treeData: data, loading: false, expandedNodes: expanded });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchFlatMembers: async () => {
    try {
      const { data } = await api.get('/members');
      set({ flatMembers: data });
    } catch { /* ignore */ }
  },

  selectNode: (node) => {
    set({ selectedNode: node });
  },

  clearSelection: () => {
    set({ selectedNode: null });
  },

  setHighlightedPath: (pathIds) => {
    set({ highlightedPath: pathIds });
  },

  clearHighlightedPath: () => {
    set({ highlightedPath: [] });
  },

  toggleExpanded: (nodeId) => {
    const expanded = new Set(get().expandedNodes);
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    set({ expandedNodes: expanded });
  },

  expandPath: (pathIds) => {
    const expanded = new Set(get().expandedNodes);
    pathIds.forEach(id => expanded.add(id));
    set({ expandedNodes: expanded });
  },

  expandAll: () => {
    const expanded = new Set();
    const tree = get().treeData;
    if (tree) collectAllIds(tree, expanded);
    set({ expandedNodes: expanded });
  },

  collapseAll: () => {
    const expanded = new Set();
    const tree = get().treeData;
    if (tree) expanded.add(tree.id);
    set({ expandedNodes: expanded });
  },

  search: async (query) => {
    set({ searchQuery: query });
    if (!query || query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }
    try {
      const { data } = await api.get(`/members?q=${encodeURIComponent(query.trim())}`);
      set({ searchResults: data });
    } catch {
      set({ searchResults: [] });
    }
  },

  refreshMember: async (id) => {
    try {
      const { data } = await api.get(`/members/${id}`);
      set({ selectedNode: data });
      await get().fetchTree();
    } catch { /* ignore */ }
  },
}));

function collectIds(node, set, depth) {
  if (!node) return;
  set.add(node.id);
  if (depth > 0 && node.children) {
    node.children.forEach(c => collectIds(c, set, depth - 1));
  }
}

function collectAllIds(node, set) {
  if (!node) return;
  set.add(node.id);
  if (node.children) {
    node.children.forEach(c => collectAllIds(c, set));
  }
}

export default useTreeStore;
