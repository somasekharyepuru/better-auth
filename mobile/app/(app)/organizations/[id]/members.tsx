import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, Pressable, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useOrganization } from '../../../../src/contexts/OrganizationContext';
import { useOrganizationRole } from '../../../../hooks';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../../../src/constants/Theme';
import { Button } from '../../../../components/ui';
import { Card } from '../../../../components/ui';
import { Avatar } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { RoleBadge } from '../../../../components/specialized';
import { ConfirmDialog } from '../../../../components/feedback';
import { EmptyState } from '../../../../components/feedback';
import { usePullToRefresh, useDebounce } from '../../../../hooks';
import { TextInput } from '../../../../components/ui';
import { ROLE_INFO } from '../../../../src/lib/role-info';
import { listMembers, listTeams, removeMember, updateMemberRole, addTeamMember } from '../../../../src/lib/auth';
import { X, ChevronLeft, ChevronRight, Layers, Trash2, CheckCircle2 } from 'lucide-react-native';
import type { Member, UserRole } from '../../../../src/lib/types';

interface MemberWithUser extends Member {
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

interface Team {
  id: string;
  name: string;
  createdAt: string;
  members?: Array<{ userId: string }>;
}

const ITEMS_PER_PAGE = 10;

export default function MembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { organizations, loadOrganizationDetails } = useOrganization();

  const orgId = params.id as string;
  const [organization, setOrganization] = useState(organizations.find(o => o.id === orgId));
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);

  // Single member actions
  const [memberToRevoke, setMemberToRevoke] = useState<MemberWithUser | null>(null);
  const [memberForRoleChange, setMemberForRoleChange] = useState<MemberWithUser | null>(null);
  const [memberForTeam, setMemberForTeam] = useState<MemberWithUser | null>(null);

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAddToTeamDialog, setShowAddToTeamDialog] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isAddingToTeam, setIsAddingToTeam] = useState(false);

  const {
    role,
    canManageMembers,
    canInviteMembers,
    canRemoveMembers,
    canChangeRole,
    canBulkManage,
  } = useOrganizationRole(orgId);

  const loadMembers = async () => {
    try {
      setError('');
      setIsLoading(true);

      const result = await listMembers(orgId);

      if ('error' in result) {
        setError(result.error.message || 'Failed to load members');
        setMembers([]);
      } else {
        // Map API response to MemberWithUser interface
        const membersWithUser: MemberWithUser[] = result.members.map((member) => ({
          ...member,
          role: member.role as UserRole,
          userName: (member as any).user?.name || (member as any).userName,
          userEmail: (member as any).user?.email || (member as any).userEmail,
          userImage: (member as any).user?.image || (member as any).userImage,
        }));
        setMembers(membersWithUser);
      }
    } catch (err) {
      setError('Failed to load members');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const result = await listTeams(orgId);
      if ('error' in result) {
        setTeams([]);
      } else {
        setTeams(result.teams as unknown as Team[]);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  useEffect(() => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setOrganization(org);
    }
    loadMembers();
    loadTeams();
  }, [orgId, organizations]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const { onRefresh } = usePullToRefresh(async () => {
    await loadMembers();
    await loadTeams();
    if (organization) {
      await loadOrganizationDetails(orgId);
      const updated = organizations.find(o => o.id === orgId);
      if (updated) setOrganization(updated);
    }
  });

  const handleRevokeMember = async () => {
    if (!memberToRevoke) return;
    try {
      setError('');
      const result = await removeMember({
        organizationId: orgId,
        memberIdOrEmail: memberToRevoke.userId,
      });
      if ('error' in result) {
        setError(result.error.message || 'Failed to remove member');
        return;
      }
      setMembers(members.filter(m => m.id !== memberToRevoke.id));
      setSelectedMembers(prev => {
        const next = new Set(prev);
        next.delete(memberToRevoke.id);
        return next;
      });
      setMemberToRevoke(null);
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleBulkRemove = async () => {
    try {
      setError('');
      const selected = members.filter(m => selectedMembers.has(m.id));
      await Promise.all(selected.map((member) =>
        removeMember({
          organizationId: orgId,
          memberIdOrEmail: member.userId,
        })
      ));
      setMembers(members.filter(m => !selectedMembers.has(m.id)));
      setSelectedMembers(new Set());
      setShowBulkRemoveDialog(false);
    } catch (err) {
      setError('Failed to remove members');
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!memberForRoleChange) return;
    try {
      setError('');
      const result = await updateMemberRole({
        organizationId: orgId,
        memberId: memberForRoleChange.id,
        role: newRole as UserRole,
      });
      if ('error' in result) {
        setError(result.error.message || 'Failed to update role');
        return;
      }
      setMembers(members.map(m =>
        m.id === memberForRoleChange!.id
          ? { ...m, role: newRole as UserRole }
          : m
      ));
      setShowRoleDialog(false);
      setMemberForRoleChange(null);
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleAddToTeam = async () => {
    if (!memberForTeam || !selectedTeamId) return;
    setIsAddingToTeam(true);
    try {
      setError('');
      const result = await addTeamMember({ teamId: selectedTeamId, userId: memberForTeam.userId });
      if ('error' in result) {
        setError(result.error.message || 'Failed to add to team');
        return;
      }
      setShowAddToTeamDialog(false);
      setSelectedTeamId('');
      setTeamSearchQuery('');
      setMemberForTeam(null);
    } catch (err) {
      setError('Failed to add to team');
    } finally {
      setIsAddingToTeam(false);
    }
  };

  const canManageMember = (member: MemberWithUser) => {
    if (member.userId === user?.id) return false;
    if (!canManageMembers) return false;

    const roleHierarchy = { owner: 5, admin: 4, manager: 3, member: 2, viewer: 1 };
    const currentRoleLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
    const memberRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy] || 0;

    return currentRoleLevel > memberRoleLevel;
  };

  const canSelectMember = (member: MemberWithUser) => {
    if (member.userId === user?.id) return false;
    if (member.role === 'owner') return false;
    return canBulkManage && canManageMember(member);
  };

  const toggleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableMembers = paginatedMembers.filter(m => canSelectMember(m));
    const selectableIds = selectableMembers.map(m => m.id);
    const currentSelectedCount = selectableIds.filter(id => selectedMembers.has(id)).length;

    if (currentSelectedCount === selectableIds.length) {
      // All current page items selected - remove them
      setSelectedMembers(prev => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Not all selected - add all current page items
      setSelectedMembers(prev => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!debouncedSearchQuery) return members;
    const query = debouncedSearchQuery.toLowerCase();
    return members.filter((member) => {
      return (
        member.userName?.toLowerCase().includes(query) ||
        member.userEmail?.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
      );
    });
  }, [members, debouncedSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const allSelectableSelected = useMemo(() => {
    const selectableCount = paginatedMembers.filter(m => canSelectMember(m)).length;
    return selectableCount > 0 && selectableCount === Array.from(selectedMembers).filter(id =>
      paginatedMembers.some(m => m.id === id)
    ).length;
  }, [paginatedMembers, selectedMembers]);

  // Filter teams for add to team dialog
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    const query = teamSearchQuery.toLowerCase();
    return teams.filter(t => t.name.toLowerCase().includes(query));
  }, [teams, teamSearchQuery]);

  // Get member teams
  const getMemberTeams = (member: MemberWithUser) => {
    return teams.filter(t =>
      t.members?.some(tm => tm.userId === member.userId)
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Members</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {organization?.name || 'Organization'}
        </Text>
        <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Search Bar */}
      {members.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      )}

      {/* Bulk Actions */}
      {selectedMembers.size > 0 && (
        <Card padding="md" style={[styles.bulkActionsCard, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive }]}>
          <View style={styles.bulkActionsContent}>
            <Text style={[styles.bulkActionsText, { color: colors.destructive }]}>
              {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
            </Text>
            <Button
              variant="destructive"
              size="sm"
              onPress={() => setShowBulkRemoveDialog(true)}
              style={styles.bulkActionButton}
            >
              <Trash2 size={16} color={colors.destructive} />
            </Button>
          </View>
        </Card>
      )}

      {error && (
        <Card padding="md" style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </Card>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading members...</Text>
        </View>
      ) : filteredMembers.length === 0 && members.length > 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            No members match "{searchQuery}"
          </Text>
        </View>
      ) : members.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No members yet"
          description="Invite people to join your organization"
          actionLabel={canInviteMembers ? 'Invite Member' : undefined}
          onAction={() => setShowInviteDialog(true)}
        />
      ) : (
        <>
          {/* Select All */}
          {canBulkManage && paginatedMembers.some(m => canSelectMember(m)) && (
            <Pressable
              style={({ pressed }) => [
                styles.selectAllContainer,
                pressed && { backgroundColor: colors.muted + '40' }
              ]}
              onPress={toggleSelectAll}
            >
              <View style={[styles.checkbox, {
                borderColor: selectedMembers.size > 0 ? colors.primary : colors.border,
                backgroundColor: selectedMembers.size > 0 ? colors.primary : 'transparent'
              }]}>
                {selectedMembers.size > 0 && (
                  <CheckCircle2 size={16} color={colors.card} />
                )}
              </View>
              <Text style={[styles.selectAllText, { color: colors.foreground }]}>
                {allSelectableSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          )}

          {paginatedMembers.map((member) => {
            const isSelected = selectedMembers.has(member.id);
            const canSelect = canSelectMember(member);
            const canManage = canManageMember(member);
            const memberTeams = getMemberTeams(member);

            return (
              <Card
                key={member.id}
                padding="md"
                style={[styles.memberCard, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}
              >
                <View style={styles.memberHeader}>
                  {/* Selection Checkbox */}
                  {canSelect && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.checkboxContainer,
                        pressed && { opacity: 0.7 }
                      ]}
                      onPress={() => toggleSelectMember(member.id)}
                    >
                      <View style={[styles.checkbox, {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent'
                      }]}>
                        {isSelected && <CheckCircle2 size={14} color={colors.card} />}
                      </View>
                    </Pressable>
                  )}

                  <Avatar
                    name={member.userName || ''}
                    email={member.userEmail || ''}
                    size="md"
                    style={styles.avatar}
                  />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, { color: colors.foreground }]}>
                        {member.userName || 'Unknown'}
                      </Text>
                      {member.userId === user?.id && (
                        <Badge size="sm" variant="secondary">You</Badge>
                      )}
                    </View>
                    <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>
                      {member.userEmail || 'No email'}
                    </Text>
                    <Text style={[styles.memberJoined, { color: colors.mutedForeground }]}>
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </Text>
                    {memberTeams.length > 0 && (
                      <View style={styles.memberTeams}>
                        {memberTeams.slice(0, 2).map(team => (
                          <Badge key={team.id} size="sm" variant="outline">
                            {team.name}
                          </Badge>
                        ))}
                        {memberTeams.length > 2 && (
                          <Badge size="sm" variant="secondary">
                            +{memberTeams.length - 2}
                          </Badge>
                        )}
                      </View>
                    )}
                  </View>
                  <RoleBadge role={member.role as any} size="sm" />
                </View>

                {/* Action Buttons */}
                {canManage && (
                  <View style={styles.memberActions}>
                    {teams.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          setMemberForTeam(member);
                          setShowAddToTeamDialog(true);
                        }}
                        style={styles.actionButton}
                      >
                        <Layers size={14} color={colors.foreground} />
                        <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Add to Team</Text>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setMemberForRoleChange(member)}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Change Role</Text>
                    </Button>
                    {canRemoveMembers && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onPress={() => setMemberToRevoke(member)}
                        style={styles.actionButton}
                      >
                        <Text>Remove</Text>
                      </Button>
                    )}
                  </View>
                )}
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Text style={[styles.paginationInfo, { color: colors.mutedForeground }]}>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
              </Text>
              <View style={styles.paginationButtons}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  <ChevronLeft size={16} color={currentPage === 1 ? colors.mutedForeground : colors.foreground} />
                </Button>
                <Text style={[styles.pageNumber, { color: colors.foreground }]}>
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  <ChevronRight size={16} color={currentPage === totalPages ? colors.mutedForeground : colors.foreground} />
                </Button>
              </View>
            </View>
          )}
        </>
      )}

      {/* Invite Button */}
      {canInviteMembers && members.length > 0 && (
        <View style={styles.inviteSection}>
          <Button
            onPress={() => setShowInviteDialog(true)}
            style={styles.inviteButton}
          >
            Invite Member
          </Button>
        </View>
      )}

      {/* Role Permissions Info Card */}
      <Card padding="lg" style={styles.permissionsCard}>
        <Text style={[styles.permissionsTitle, { color: colors.foreground }]}>Role Permissions</Text>
        <Text style={[styles.permissionsSubtitle, { color: colors.mutedForeground }]}>
          Understanding what each role can do
        </Text>
        {Object.entries(ROLE_INFO).map(([roleKey, info]) => (
          <View key={roleKey} style={styles.permissionItem}>
            <Badge
              size="sm"
              style={{ backgroundColor: getRoleColor(roleKey as any) + '20' }}
            >
              <Text style={{ color: getRoleColor(roleKey as any), fontSize: 10, fontWeight: '600' }}>
                {info.name}
              </Text>
            </Badge>
            <Text style={[styles.permissionDescription, { color: colors.mutedForeground }]}>
              {info.description}
            </Text>
          </View>
        ))}
      </Card>

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        visible={memberToRevoke !== null}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRevoke?.userName || 'this member'} from the organization?`}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onConfirm={handleRevokeMember}
        onCancel={() => setMemberToRevoke(null)}
      />

      {/* Bulk Remove Confirmation Dialog */}
      <ConfirmDialog
        visible={showBulkRemoveDialog}
        title={`Remove ${selectedMembers.size} Members`}
        message={`Are you sure you want to remove ${selectedMembers.size} member(s) from the organization?`}
        confirmLabel="Remove All"
        confirmVariant="destructive"
        onConfirm={handleBulkRemove}
        onCancel={() => setShowBulkRemoveDialog(false)}
      />

      {/* Role Change Dialog */}
      <Modal
        visible={showRoleDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRoleDialog(false);
          setMemberForRoleChange(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowRoleDialog(false);
            setMemberForRoleChange(null);
          }}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Change Role
              </Text>
              <Pressable onPress={() => {
                setShowRoleDialog(false);
                setMemberForRoleChange(null);
              }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
                Select a new role for {memberForRoleChange?.userName || 'this member'}
              </Text>

              <ScrollView style={styles.teamsList} nestedScrollEnabled>
                {Object.entries(ROLE_INFO)
                  .filter(([key]) => key !== 'owner')
                  .map(([key, info]) => (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [
                        styles.roleOption,
                        { backgroundColor: colors.input, borderColor: colors.border },
                        pressed && { backgroundColor: colors.muted + '40' }
                      ]}
                      onPress={() => handleRoleChange(key)}
                    >
                      <Badge
                        size="sm"
                        style={{ backgroundColor: getRoleColor(key as any) + '20' }}
                      >
                        <Text style={{ color: getRoleColor(key as any), fontSize: 11, fontWeight: '600' }}>
                          {info.name}
                        </Text>
                      </Badge>
                      <Text style={[styles.roleOptionDescription, { color: colors.mutedForeground }]}>
                        {info.description}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                variant="outline"
                onPress={() => {
                  setShowRoleDialog(false);
                  setMemberForRoleChange(null);
                }}
                style={styles.modalButton}
              >
                <Text style={{ color: colors.foreground }}>Close</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invite Dialog Placeholder */}
      <ConfirmDialog
        visible={showInviteDialog}
        title="Invite Member"
        message="Enter the email address of the person you want to invite."
        confirmLabel="Send Invite"
        onConfirm={() => setShowInviteDialog(false)}
        onCancel={() => setShowInviteDialog(false)}
      >
        <Text style={[styles.dialogNote, { color: colors.mutedForeground }]}>
          Invite functionality will be implemented with the invitation screens.
        </Text>
      </ConfirmDialog>

      {/* Add to Team Dialog */}
      <Modal
        visible={showAddToTeamDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddToTeamDialog(false);
          setMemberForTeam(null);
          setSelectedTeamId('');
          setTeamSearchQuery('');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowAddToTeamDialog(false);
            setMemberForTeam(null);
            setSelectedTeamId('');
            setTeamSearchQuery('');
          }}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Add to Team
              </Text>
              <Pressable onPress={() => setShowAddToTeamDialog(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
                Add {memberForTeam?.userName || memberForTeam?.userEmail} to a team
              </Text>

              <TextInput
                placeholder="Search teams..."
                value={teamSearchQuery}
                onChangeText={setTeamSearchQuery}
                style={styles.teamSearchInput}
              />

              <ScrollView style={styles.teamsList} nestedScrollEnabled>
                {filteredTeams.length === 0 ? (
                  <View style={styles.emptyTeams}>
                    <Text style={[styles.emptyTeamsText, { color: colors.mutedForeground }]}>
                      {teamSearchQuery ? 'No teams match your search' : 'No teams available'}
                    </Text>
                  </View>
                ) : (
                  filteredTeams.map(team => (
                    <Pressable
                      key={team.id}
                      style={({ pressed }) => [
                        styles.teamOption,
                        {
                          backgroundColor: colors.input,
                          borderColor: selectedTeamId === team.id ? colors.primary : colors.border
                        },
                        pressed && { backgroundColor: colors.muted + '40' }
                      ]}
                      onPress={() => setSelectedTeamId(team.id)}
                    >
                      <View style={styles.teamOptionContent}>
                        <View style={[styles.teamIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Layers size={18} color={colors.primary} />
                        </View>
                        <View style={styles.teamInfo}>
                          <Text style={[styles.teamName, { color: colors.foreground }]}>{team.name}</Text>
                          <Text style={[styles.teamDate, { color: colors.mutedForeground }]}>
                            Created {new Date(team.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {selectedTeamId === team.id && (
                          <CheckCircle2 size={20} color={colors.primary} />
                        )}
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                variant="outline"
                onPress={() => {
                  setShowAddToTeamDialog(false);
                  setMemberForTeam(null);
                  setSelectedTeamId('');
                  setTeamSearchQuery('');
                }}
                style={styles.modalButton}
              >
                <Text style={{ color: colors.foreground }}>Cancel</Text>
              </Button>
              <Button
                onPress={handleAddToTeam}
                disabled={!selectedTeamId || isAddingToTeam}
                loading={isAddingToTeam}
                style={styles.modalButton}
              >
                Add to Team
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Helper function to get role color
function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    owner: '#ef4444',
    admin: '#f97316',
    manager: '#eab308',
    member: '#3b82f6',
    viewer: '#6b7280',
  };
  return colors[role] || colors.member;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  memberCount: {
    ...Typography.bodySmall,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  bulkActionsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  bulkActionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkActionsText: {
    ...Typography.body,
    fontWeight: '600',
  },
  bulkActionButton: {
    paddingHorizontal: Spacing.sm,
  },
  errorCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    ...Typography.body,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  checkboxContainer: {
    padding: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllText: {
    ...Typography.body,
    fontWeight: '500',
  },
  memberCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    marginRight: Spacing.sm,
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberName: {
    ...Typography.body,
    fontWeight: '600',
  },
  memberEmail: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  memberJoined: {
    ...Typography.caption,
    marginTop: 2,
  },
  memberTeams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  pagination: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  paginationInfo: {
    ...Typography.bodySmall,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  paginationButton: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  pageNumber: {
    ...Typography.body,
    fontWeight: '500',
  },
  inviteSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  inviteButton: {
    width: '100%',
  },
  permissionsCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  permissionsTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  permissionsSubtitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  permissionDescription: {
    ...Typography.bodySmall,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  roleOptions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  roleOption: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  roleOptionDescription: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  dialogNote: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  teamSearchInput: {
    marginBottom: Spacing.md,
  },
  teamsList: {
    maxHeight: 250,
  },
  emptyTeams: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyTeamsText: {
    ...Typography.body,
  },
  teamOption: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  teamOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...Typography.body,
    fontWeight: '600',
  },
  teamDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
  },
});
