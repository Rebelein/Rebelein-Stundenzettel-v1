"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const defaultTargetHours = {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
};

type Weekday = keyof typeof defaultTargetHours;

interface UserManagementProps {
  users: User[];
  addUser: (name: string, targetHours: User['targetHours']) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

export function UserManagement({ users, addUser, updateUser, deleteUser }: UserManagementProps) {
  const [newUserName, setNewUserName] = useState('');
  const [newTargetHours, setNewTargetHours] = useState(defaultTargetHours);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTargetHours, setEditingTargetHours] = useState(defaultTargetHours);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (editingUser) {
        setEditingName(editingUser.name);
        setEditingTargetHours(editingUser.targetHours || defaultTargetHours);
    }
  }, [editingUser]);

  const handleAddUser = () => {
    if (newUserName.trim()) {
      addUser(newUserName.trim(), newTargetHours);
      setNewUserName('');
      setNewTargetHours(defaultTargetHours);
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSaveUpdate = () => {
    if (editingUser && editingName.trim()) {
      updateUser({ ...editingUser, name: editingName.trim(), targetHours: editingTargetHours });
      handleCancelEdit();
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };
  
  const confirmDelete = () => {
      if(userToDelete) {
          deleteUser(userToDelete.id);
          setUserToDelete(null);
      }
  }

  const renderTargetHoursInputs = (
      hours: User['targetHours'],
      setter: React.Dispatch<React.SetStateAction<User['targetHours']>>
  ) => {
      return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {(Object.keys(defaultTargetHours) as Weekday[]).map(day => (
                   <div key={day} className="grid gap-1.5">
                       <Label htmlFor={`${day}-hours`}>{day.charAt(0).toUpperCase() + day.slice(1)}</Label>
                       <Input
                           id={`${day}-hours`}
                           type="number"
                           step="0.5"
                           value={hours?.[day] || 0}
                           onChange={(e) => setter(prev => ({ ...prev, [day]: parseFloat(e.target.value) || 0 }))}
                       />
                   </div>
              ))}
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Neuen Benutzer hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name des neuen Benutzers"
              />
              <div>
                  <Label className="text-sm font-medium">Tägliche Soll-Stunden</Label>
                  {renderTargetHoursInputs(newTargetHours, setNewTargetHours)}
              </div>
            <Button onClick={handleAddUser}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vorhandene Benutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {users.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg">
                {editingUser?.id === user.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8"
                    />
                    <div>
                        <Label className="text-sm font-medium">Tägliche Soll-Stunden</Label>
                        {renderTargetHoursInputs(editingTargetHours, setEditingTargetHours)}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={handleSaveUpdate}>
                        <Save className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                          <span>Mo: {user.targetHours?.monday || 0}h</span>
                          <span>Di: {user.targetHours?.tuesday || 0}h</span>
                          <span>Mi: {user.targetHours?.wednesday || 0}h</span>
                          <span>Do: {user.targetHours?.thursday || 0}h</span>
                          <span>Fr: {user.targetHours?.friday || 0}h</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(user)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {userToDelete && (
        <Dialog open={true} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer wirklich löschen?</DialogTitle>
            </DialogHeader>
            <p>
              Möchten Sie den Benutzer "{userToDelete.name}" wirklich löschen? Alle zugehörigen
              Zeiteinträge werden ebenfalls unwiderruflich entfernt.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Abbrechen
                </Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={confirmDelete}>
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
