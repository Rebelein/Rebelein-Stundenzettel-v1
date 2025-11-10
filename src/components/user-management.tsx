"use client";

import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface UserManagementProps {
  users: User[];
  addUser: (name: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

export function UserManagement({ users, addUser, updateUser, deleteUser }: UserManagementProps) {
  const [newUserName, setNewUserName] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingName, setEditingName] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleAddUser = () => {
    if (newUserName.trim()) {
      addUser(newUserName.trim());
      setNewUserName('');
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditingName(user.name);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditingName('');
  };

  const handleSaveUpdate = () => {
    if (editingUser && editingName.trim()) {
      updateUser({ ...editingUser, name: editingName.trim() });
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Neuen Benutzer hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Name des neuen Benutzers"
            />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {editingUser?.id === user.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      user.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingUser?.id === user.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={handleSaveUpdate}>
                          <Save className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(user)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
