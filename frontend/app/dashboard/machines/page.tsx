'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineService } from '@/services/api';
import { useAuth } from '@/components/Providers';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Radio, 
  Check, 
  X,
  AlertOctagon,
  HelpCircle,
  Link as LinkIcon,
  Unlink,
  Cpu
} from 'lucide-react';

export default function MachinesPage() {
  const { activeRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // Form states
  const [formMachineId, setFormMachineId] = useState('');
  const [formName, setFormName] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('Caterpillar Inc.');
  const [formCategory, setFormCategory] = useState('CAT Hydraulic Excavator');
  const [formModel, setFormModel] = useState('');
  const [formFirmware, setFormFirmware] = useState('');
  const [formPlc, setFormPlc] = useState('');
  const [formCpu, setFormCpu] = useState('');
  const [formRam, setFormRam] = useState('');
  const [formStorage, setFormStorage] = useState('');
  const [formPorts, setFormPorts] = useState('USB, COM1, Ethernet');
  const [formModules, setFormModules] = useState('Analog Input, Digital IO');
  const [formSensors, setFormSensors] = useState(8);

  const [connectionType, setConnectionType] = useState('Ethernet');

  // Fetch machines list
  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machinesList', categoryFilter, statusFilter, searchTerm],
    queryFn: () => machineService.list({ 
      category: categoryFilter || undefined, 
      status: statusFilter || undefined,
      search: searchTerm || undefined
    })
  });

  // Create machine mutation
  const createMutation = useMutation({
    mutationFn: machineService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machinesList'] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Error creating machine');
    }
  });

  // Update machine mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => machineService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machinesList'] });
      setIsEditOpen(false);
      setSelectedMachine(null);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Error updating machine');
    }
  });

  // Delete machine mutation
  const deleteMutation = useMutation({
    mutationFn: machineService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machinesList'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Error deleting machine');
    }
  });

  // Connect/Disconnect mutations
  const connectMutation = useMutation({
    mutationFn: ({ machineId, type }: { machineId: string; type: string }) => machineService.connect(machineId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machinesList'] });
      setIsConnectOpen(false);
      setSelectedMachine(null);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: machineService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machinesList'] });
    }
  });

  const resetForm = () => {
    setFormMachineId('');
    setFormName('');
    setFormManufacturer('Caterpillar Inc.');
    setFormCategory('CAT Hydraulic Excavator');
    setFormModel('');
    setFormFirmware('');
    setFormPlc('');
    setFormCpu('');
    setFormRam('');
    setFormStorage('');
    setFormPorts('USB, COM1, Ethernet');
    setFormModules('Analog Input, Digital IO');
    setFormSensors(8);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      machine_id: formMachineId,
      name: formName,
      manufacturer: formManufacturer,
      category: formCategory,
      model: formModel,
      reference_config: {
        firmware: formFirmware,
        plc_version: formPlc,
        cpu: formCpu,
        ram: formRam,
        storage: formStorage,
        communication_ports: formPorts.split(',').map(s => s.trim()),
        installed_modules: formModules.split(',').map(s => s.trim()),
        sensor_count: Number(formSensors)
      }
    };
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    const data = {
      name: formName,
      manufacturer: formManufacturer,
      category: formCategory,
      model: formModel,
      reference_config: {
        firmware: formFirmware,
        plc_version: formPlc,
        cpu: formCpu,
        ram: formRam,
        storage: formStorage,
        communication_ports: formPorts.split(',').map(s => s.trim()),
        installed_modules: formModules.split(',').map(s => s.trim()),
        sensor_count: Number(formSensors)
      }
    };
    updateMutation.mutate({ id: selectedMachine.id, data });
  };

  const openEditModal = (machine: any) => {
    setSelectedMachine(machine);
    setFormMachineId(machine.machine_id);
    setFormName(machine.name);
    setFormManufacturer(machine.manufacturer);
    setFormCategory(machine.category);
    setFormModel(machine.model);
    
    const ref = machine.reference_config || {};
    setFormFirmware(ref.firmware || '');
    setFormPlc(ref.plc_version || '');
    setFormCpu(ref.cpu || '');
    setFormRam(ref.ram || '');
    setFormStorage(ref.storage || '');
    setFormPorts(ref.communication_ports?.join(', ') || '');
    setFormModules(ref.installed_modules?.join(', ') || '');
    setFormSensors(ref.sensor_count || 8);
    
    setIsEditOpen(true);
  };

  const openConnectModal = (machine: any) => {
    setSelectedMachine(machine);
    setIsConnectOpen(true);
  };

  const handleExportCSV = () => {
    if (machines.length === 0) return;
    
    const headers = ['Machine ID', 'Name', 'Manufacturer', 'Category', 'Model', 'Status', 'Firmware', 'PLC Version', 'CPU', 'RAM', 'Storage', 'Sensors'];
    const rows = machines.map((m: any) => [
      m.machine_id,
      m.name,
      m.manufacturer,
      m.category,
      m.model,
      m.status,
      m.reference_config?.firmware || '',
      m.reference_config?.plc_version || '',
      m.reference_config?.cpu || '',
      m.reference_config?.ram || '',
      m.reference_config?.storage || '',
      m.reference_config?.sensor_count || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: any[]) => e.map((val: any) => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CAT_Fleet_Configuration_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    'CAT Hydraulic Excavator',
    'CAT Wheel Loader',
    'CAT Bulldozer',
    'CAT Motor Grader',
    'CAT Diesel Generator'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FLEET MANAGEMENT</h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
            Audit reference hardware configuration blueprints and connection status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded px-3 py-2 text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
          
          {activeRole === 'Administrator' && (
            <button
              onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="flex items-center space-x-1 bg-primary hover:bg-primary-dark text-black rounded px-3 py-2 text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD MACHINE</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- SEARCH & FILTERS ----------------- */}
      <div className="card-industrial p-4 flex flex-col md:flex-row gap-4 bg-white items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by ID, model, name, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary-dark"
          />
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-48 bg-white border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-36 bg-white border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="Connected">Connected</option>
            <option value="Disconnected">Disconnected</option>
            <option value="Waiting">Waiting</option>
            <option value="Connection Failed">Connection Failed</option>
          </select>
        </div>
      </div>

      {/* ----------------- MACHINES TABLE ----------------- */}
      <div className="card-industrial bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="table-header text-[10px] uppercase font-bold tracking-wider">
                <th className="p-4">Machine ID</th>
                <th className="p-4">Machine Profile</th>
                <th className="p-4">Category</th>
                <th className="p-4">Hardware Profile (Ref)</th>
                <th className="p-4">Connection</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading fleet database...</td>
                </tr>
              ) : machines.length > 0 ? (
                machines.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-gray-900">{m.machine_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-950">{m.name}</div>
                      <div className="text-[10px] text-gray-500">{m.manufacturer} | Model {m.model}</div>
                    </td>
                    <td className="p-4 text-gray-700 font-semibold">{m.category}</td>
                    <td className="p-4 font-mono text-[10px] text-gray-600">
                      <div>FW: {m.reference_config?.firmware}</div>
                      <div>CPU: {m.reference_config?.cpu}</div>
                      <div>Memory: {m.reference_config?.ram} / {m.reference_config?.storage}</div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        m.status === 'Connected' 
                          ? 'badge-green' 
                          : m.status === 'Disconnected' 
                            ? 'badge-yellow' 
                            : m.status === 'Waiting'
                              ? 'badge-blue'
                              : 'badge-red'
                      }`}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Connection Simulation toggler */}
                        {m.status === 'Connected' || m.status === 'Waiting' || m.status === 'Connection Failed' ? (
                          <button
                            onClick={() => disconnectMutation.mutate(m.machine_id)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                            title="Disconnect telemetry link"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openConnectModal(m)}
                            className="p-1.5 text-success hover:bg-green-50 rounded"
                            title="Simulate connection"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        )}

                        {/* Admin actions */}
                        {activeRole === 'Administrator' && (
                          <>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                              title="Edit specifications"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if(confirm(`Confirm permanent deletion of ${m.name} (${m.machine_id})?`)) {
                                  deleteMutation.mutate(m.id);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Delete machine blueprint"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No machine blueprints match the query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- CONNECTION SIMULATOR MODAL ----------------- */}
      {isConnectOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-gray-200">
            <div className="bg-industrial-dark text-white p-4 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center">
                <Radio className="w-4 h-4 mr-2 text-primary" />
                Connect Simulator Link
              </span>
              <button onClick={() => setIsConnectOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                Simulate plug-and-play machine link detection for <span className="font-bold text-gray-900">{selectedMachine.name} ({selectedMachine.machine_id})</span>.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Supported Connection Interface</label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-semibold text-gray-700"
                >
                  <option value="Ethernet">Ethernet (IP Address)</option>
                  <option value="PLC">PLC (Siemens TIA S7 Link)</option>
                  <option value="USB">USB (COM Interface)</option>
                  <option value="COM Port">COM Port (Serial COM9 - Fails)</option>
                  <option value="Serial">Serial RS-232</option>
                  <option value="Industrial Controller">Industrial Controller (ABB Link)</option>
                </select>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  onClick={() => setIsConnectOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded text-xs font-bold hover:bg-gray-50 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => connectMutation.mutate({ machineId: selectedMachine.machine_id, type: connectionType })}
                  className="flex-1 bg-primary text-black py-2 rounded text-xs font-bold hover:bg-primary-dark uppercase"
                >
                  Initialize Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADD / EDIT MACHINE MODAL ----------------- */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-200 my-8">
            <div className="bg-industrial-dark text-white p-4 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-primary" />
                {isAddOpen ? 'Add Machine Blueprint' : 'Edit Specifications Blueprint'}
              </span>
              <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <h3 className="text-xs font-black text-gray-900 border-b border-gray-100 pb-1 uppercase tracking-widest">1. Machine Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Machine Unique ID</label>
                  <input
                    type="text"
                    required
                    disabled={isEditOpen}
                    value={formMachineId}
                    onChange={(e) => setFormMachineId(e.target.value)}
                    placeholder="e.g. CAT-HEX-320"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Machine Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CAT Hydraulic Excavator"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={formManufacturer}
                    onChange={(e) => setFormManufacturer(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Model Version</label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. 320-GC"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Class</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-700"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="text-xs font-black text-gray-900 border-b border-gray-100 pb-1 pt-2 uppercase tracking-widest">2. Reference Blueprint Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Firmware</label>
                  <input
                    type="text"
                    required
                    value={formFirmware}
                    onChange={(e) => setFormFirmware(e.target.value)}
                    placeholder="e.g. v4.2.1-lts"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target PLC Version</label>
                  <input
                    type="text"
                    required
                    value={formPlc}
                    onChange={(e) => setFormPlc(e.target.value)}
                    placeholder="e.g. v3.12-revB"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Processor (CPU)</label>
                  <input
                    type="text"
                    required
                    value={formCpu}
                    onChange={(e) => setFormCpu(e.target.value)}
                    placeholder="e.g. Intel Atom E3950"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">RAM Capacity</label>
                  <input
                    type="text"
                    required
                    value={formRam}
                    onChange={(e) => setFormRam(e.target.value)}
                    placeholder="e.g. 8GB DDR3"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Storage Size</label>
                  <input
                    type="text"
                    required
                    value={formStorage}
                    onChange={(e) => setFormStorage(e.target.value)}
                    placeholder="e.g. 64GB SSD"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Reference Sensor Count</label>
                  <input
                    type="number"
                    required
                    value={formSensors}
                    onChange={(e) => setFormSensors(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Communication Ports (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={formPorts}
                    onChange={(e) => setFormPorts(e.target.value)}
                    placeholder="USB, COM1, COM2, Ethernet"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Installed Modules (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={formModules}
                    onChange={(e) => setFormModules(e.target.value)}
                    placeholder="Analog Input, Digital IO, CAN Bus controller"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded text-xs font-bold hover:bg-gray-50 uppercase"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-primary text-black py-2.5 rounded text-xs font-bold hover:bg-primary-dark uppercase"
                >
                  {isAddOpen ? 'Save Blueprint' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
