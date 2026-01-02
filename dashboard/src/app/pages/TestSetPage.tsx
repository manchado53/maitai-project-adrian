import { useState, useEffect } from 'react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card } from '../components/ui/card';
import { Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTestSet, getTestCases, type TestSetInfo, type TestCase } from '../lib/api';

export function TestSetPage() {
  const [testSetInfo, setTestSetInfo] = useState<TestSetInfo | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [infoRes, casesRes] = await Promise.all([
          getTestSet(),
          getTestCases(),
        ]);
        setTestSetInfo(infoRes);
        setTestCases(casesRes.cases);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test set');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading test set...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  const categories = testSetInfo?.categories || [];

  // Filter test cases
  const filteredCases = testCases.filter(tc => {
    if (filterCategory !== 'all' && tc.expected !== filterCategory) return false;
    if (searchQuery && !tc.ticket.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Category distribution
  const categoryDistribution = categories.map(cat => ({
    category: cat,
    count: testSetInfo?.category_counts[cat] || 0
  }));

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Test Set</h2>
        <p className="text-muted-foreground">
          {testSetInfo?.total || 0} test cases | {categories.length} categories
        </p>
      </div>

      {/* Category Distribution Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Category Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="w-64">
          <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Test Cases Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Ticket Text</TableHead>
              <TableHead className="w-40">Expected Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map(tc => (
              <TableRow key={tc.id}>
                <TableCell className="font-mono text-sm">{tc.id}</TableCell>
                <TableCell>{tc.ticket}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tc.expected}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {paginatedCases.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No test cases found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
