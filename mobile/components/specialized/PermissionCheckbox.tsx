/**
 * PermissionCheckbox Component
 *
 * A specialized checkbox component for managing role-based permissions.
 * Displays resource permissions with expandable sections for individual actions.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/Theme';
import { RESOURCES, PERMISSION_DESCRIPTIONS, Resource, Action } from '../../src/lib/permissions';
import { CheckBox } from '../ui/CheckBox';
import { applyAlpha } from '../../src/lib/utils';

export interface PermissionState {
  [resource: string]: string[];
}

interface PermissionCheckboxProps {
  permissions: PermissionState;
  onChange: (permissions: PermissionState) => void;
  disabled?: boolean;
}

export const PermissionCheckbox: React.FC<PermissionCheckboxProps> = ({
  permissions,
  onChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set(Object.keys(permissions))
  );

  const isResourceChecked = (resource: string, action: string): boolean => {
    return permissions[resource]?.includes(action) || false;
  };

  const isResourceFullyChecked = (resource: string): boolean => {
    const resourcePermissions = permissions[resource] || [];
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    return resourcePermissions.length === allActions.length;
  };

  const isResourceIndeterminate = (resource: string): boolean => {
    const resourcePermissions = permissions[resource] || [];
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    return resourcePermissions.length > 0 && resourcePermissions.length < allActions.length;
  };

  const handleResourceToggle = (resource: string) => {
    const allActions = RESOURCES[resource as keyof typeof RESOURCES];
    const isFullyChecked = isResourceFullyChecked(resource);

    const newPermissions = { ...permissions };
    if (isFullyChecked) {
      delete newPermissions[resource];
    } else {
      newPermissions[resource] = [...allActions];
    }
    onChange(newPermissions);
  };

  const handlePermissionToggle = (resource: string, action: string) => {
    const resourcePermissions = permissions[resource] || [];
    const newPermissions = { ...permissions };

    if (resourcePermissions.includes(action)) {
      newPermissions[resource] = resourcePermissions.filter((a) => a !== action);
      if (newPermissions[resource].length === 0) {
        delete newPermissions[resource];
      }
    } else {
      newPermissions[resource] = [...resourcePermissions, action];
    }

    onChange(newPermissions);
  };

  const toggleResourceExpanded = (resource: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  };

  const getPermissionCount = (): number => {
    let count = 0;
    for (const actions of Object.values(permissions)) {
      count += actions.length;
    }
    return count;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.foreground }]}>
          Permissions ({getPermissionCount()})
        </Text>
      </View>

      {Object.entries(RESOURCES).map(([resource, actions]) => {
        const isExpanded = expandedResources.has(resource);
        const isFullyChecked = isResourceFullyChecked(resource);
        const isIndeterminate = isResourceIndeterminate(resource);

        return (
          <View
            key={resource}
            style={[
              styles.resourceSection,
              { borderBottomColor: colors.border, backgroundColor: applyAlpha(colors.muted, 0.06) },
            ]}
          >
            <Pressable
              onPress={() => toggleResourceExpanded(resource)}
              style={styles.resourceHeader}
            >
              <View style={styles.resourceCheckboxContainer}>
                <CheckBox
                  checked={isFullyChecked}
                  indeterminate={isIndeterminate}
                  onChange={() => handleResourceToggle(resource)}
                  disabled={disabled}
                  haptic={false}
                />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceName, { color: colors.foreground }]}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </Text>
                <Text style={[styles.resourceActions, { color: colors.mutedForeground }]}>
                  {isFullyChecked
                    ? 'All permissions selected'
                    : `${permissions[resource]?.length || 0} of ${actions.length} selected`}
                </Text>
              </View>
              <Text style={[styles.expandIcon, { color: colors.mutedForeground }]}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.actionsContainer}>
                {actions.map((action) => {
                  const isChecked = isResourceChecked(resource, action);
                  return (
                    <Pressable
                      key={action}
                      onPress={() => handlePermissionToggle(resource, action)}
                      style={styles.actionRow}
                    >
                      <CheckBox
                        checked={isChecked}
                        disabled={disabled}
                        size="sm"
                        haptic={false}
                      />
                      <Text
                        style={[styles.actionLabel, { color: colors.mutedForeground }]}
                      >
                        {PERMISSION_DESCRIPTIONS[resource as keyof typeof PERMISSION_DESCRIPTIONS]?.[action] || action}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerText: {
    ...Typography.body,
    fontWeight: '600',
  },
  resourceSection: {
    borderBottomWidth: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  resourceCheckboxContainer: {
    marginRight: Spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  resourceActions: {
    ...Typography.caption,
  },
  expandIcon: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  actionsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    ...Typography.bodySmall,
    marginLeft: Spacing.md,
    flex: 1,
  },
});
