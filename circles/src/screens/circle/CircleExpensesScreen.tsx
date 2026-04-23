import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface Expense {
  id: string;
  amount: number;
  description: string;
  paidByUid: string;
  paidByName: string;
  splits: { uid: string; name: string; amount: number }[];
  planId: string | null;
  createdAt: number;
}

interface Balance {
  uid: string;
  name: string;
  amount: number; // positive = they owe you, negative = you owe them
}

interface CircleExpensesScreenProps {
  route: {
    params: {
      circleId: string;
    };
  };
  navigation: any;
}

/**
 * Expense Card Component
 */
const ExpenseCard: React.FC<{
  expense: Expense;
  currentUid: string;
}> = ({ expense, currentUid }) => {
  const userSplit = expense.splits.find((s) => s.uid === currentUid);
  const userShare = userSplit?.amount || 0;

  return (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
        <Text style={styles.expenseDate}>
          {new Date(expense.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.expenseDescription}>
        {expense.description || 'No description'}
      </Text>

      <Text style={styles.paidBy}>Paid by {expense.paidByName}</Text>

      {/* Split between avatars */}
      <View style={styles.splitRow}>
        <Text style={styles.splitLabel}>Split between:</Text>
        <View style={styles.avatarRow}>
          {expense.splits.map((split) => (
            <View key={split.uid} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {split.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* User's share */}
      {userShare > 0 && (
        <View style={styles.userShareBox}>
          <Text style={styles.userShareText}>Your share: ₹{userShare}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Balance Row Component
 */
const BalanceRow: React.FC<{
  balance: Balance;
  onSettleUp: () => void;
}> = ({ balance, onSettleUp }) => {
  const isOwed = balance.amount > 0;
  const isSettled = balance.amount === 0;

  return (
    <View style={styles.balanceRow}>
      {/* Avatar */}
      <View style={styles.balanceAvatar}>
        <Text style={styles.balanceAvatarText}>
          {balance.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name and amount */}
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceName}>{balance.name}</Text>
        {isSettled ? (
          <Text style={styles.balanceSettled}>Settled up ✓</Text>
        ) : isOwed ? (
          <Text style={styles.balanceOwed}>{balance.name} owes you ₹{balance.amount}</Text>
        ) : (
          <Text style={styles.balanceOwe}>You owe {balance.name} ₹{Math.abs(balance.amount)}</Text>
        )}
      </View>

      {/* Settle up button */}
      {!isSettled && !isOwed && (
        <TouchableOpacity style={styles.settleButton} onPress={onSettleUp}>
          <Text style={styles.settleButtonText}>Settle Up</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Settle Up Modal
 */
const SettleUpModal: React.FC<{
  visible: boolean;
  balance: Balance | null;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ visible, balance, onClose, onConfirm }) => {
  if (!balance) return null;

  const amount = Math.abs(balance.amount);

  const handlePaymentApp = (app: 'gpay' | 'phonepe' | 'paytm') => {
    // Note: These are example deep link formats
    // Actual implementation would need proper UPI IDs and formatting

    let url = '';

    if (app === 'gpay') {
      url = `intent://pay?pa=&am=${amount}&cu=INR&tn=Circles#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    } else if (app === 'phonepe') {
      url = `phonepe://pay?pa=&am=${amount}&cu=INR&tn=Circles`;
    } else if (app === 'paytm') {
      url = `paytmmp://pay?pa=&am=${amount}&cu=INR&tn=Circles`;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `${app} app not installed`);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.settleModal}>
          <Text style={styles.settleModalTitle}>Settle Up with {balance.name}</Text>
          <Text style={styles.settleModalAmount}>₹{amount}</Text>

          <Text style={styles.settleModalLabel}>Choose payment app:</Text>

          {/* Payment app buttons */}
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => handlePaymentApp('gpay')}
          >
            <Text style={styles.paymentButtonText}>💳 Google Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => handlePaymentApp('phonepe')}
          >
            <Text style={styles.paymentButtonText}>📱 PhonePe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => handlePaymentApp('paytm')}
          >
            <Text style={styles.paymentButtonText}>💰 Paytm</Text>
          </TouchableOpacity>

          {/* Confirm payment button */}
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>
              I've paid {balance.name} ₹{amount}
            </Text>
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Circle Expenses Screen
 */
export default function CircleExpensesScreen({
  route,
  navigation,
}: CircleExpensesScreenProps) {
  const { circleId } = route.params;
  const currentUid = auth.currentUser?.uid;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);

  // Load expenses
  useEffect(() => {
    const expensesRef = collection(firestore, `circles/${circleId}/expenses`);
    const q = query(expensesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseList: Expense[] = [];
      snapshot.forEach((doc) => {
        expenseList.push({
          id: doc.id,
          ...doc.data(),
        } as Expense);
      });

      setExpenses(expenseList);
      calculateBalances(expenseList);
    });

    return () => unsubscribe();
  }, [circleId, currentUid]);

  const calculateBalances = (expenseList: Expense[]) => {
    if (!currentUid) return;

    // Calculate net balances between current user and each member
    const balanceMap: Record<string, { name: string; amount: number }> = {};

    expenseList.forEach((expense) => {
      // If current user paid
      if (expense.paidByUid === currentUid) {
        expense.splits.forEach((split) => {
          if (split.uid !== currentUid) {
            if (!balanceMap[split.uid]) {
              balanceMap[split.uid] = { name: split.name, amount: 0 };
            }
            balanceMap[split.uid].amount += split.amount; // They owe me
          }
        });
      } else {
        // Someone else paid
        const mySplit = expense.splits.find((s) => s.uid === currentUid);
        if (mySplit) {
          if (!balanceMap[expense.paidByUid]) {
            balanceMap[expense.paidByUid] = {
              name: expense.paidByName,
              amount: 0,
            };
          }
          balanceMap[expense.paidByUid].amount -= mySplit.amount; // I owe them
        }
      }
    });

    // Convert to array
    const balanceList: Balance[] = Object.entries(balanceMap).map(
      ([uid, data]) => ({
        uid,
        name: data.name,
        amount: data.amount,
      })
    );

    // Calculate total balance
    const total = balanceList.reduce((sum, b) => sum + b.amount, 0);

    setBalances(balanceList);
    setTotalBalance(total);
  };

  const handleSettleUp = (balance: Balance) => {
    setSelectedBalance(balance);
    setSettleModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBalance) return;

    try {
      // In a real app, this would update the balances collection
      // For now, we'll just show a success message

      Alert.alert('Success', `Payment to ${selectedBalance.name} recorded`);
      setSettleModalVisible(false);
      setSelectedBalance(null);

      // TODO: Update Firestore balances
      // This could be done by creating a "settlement" document
      // or by recalculating balances after marking expenses as settled
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpenseScreen', { circleId });
  };

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      <View
        style={[
          styles.summaryBanner,
          totalBalance > 0
            ? styles.summaryBannerOwed
            : totalBalance < 0
            ? styles.summaryBannerOwe
            : styles.summaryBannerSettled,
        ]}
      >
        {totalBalance === 0 ? (
          <Text style={styles.summaryText}>All settled up ✓</Text>
        ) : totalBalance > 0 ? (
          <Text style={styles.summaryText}>
            You are owed ₹{totalBalance} in total
          </Text>
        ) : (
          <Text style={styles.summaryText}>
            You owe ₹{Math.abs(totalBalance)} in total
          </Text>
        )}
      </View>

      <ScrollView>
        {/* Balance section */}
        {balances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balances</Text>
            {balances.map((balance) => (
              <BalanceRow
                key={balance.uid}
                balance={balance}
                onSettleUp={() => handleSettleUp(balance)}
              />
            ))}
          </View>
        )}

        {/* Expense list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add an expense
              </Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUid={currentUid || ''}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add expense FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Settle up modal */}
      <SettleUpModal
        visible={settleModalVisible}
        balance={selectedBalance}
        onClose={() => {
          setSettleModalVisible(false);
          setSelectedBalance(null);
        }}
        onConfirm={handleConfirmPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  summaryBanner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryBannerOwed: {
    backgroundColor: '#D4EDDA',
  },
  summaryBannerOwe: {
    backgroundColor: '#F8D7DA',
  },
  summaryBannerSettled: {
    backgroundColor: '#E2E3E5',
  },
  summaryText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceAvatarText: {
    fontSize: 18,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  balanceOwed: {
    fontSize: Typography.fontSize.sm,
    color: '#28A745',
  },
  balanceOwe: {
    fontSize: Typography.fontSize.sm,
    color: '#DC3545',
  },
  balanceSettled: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  settleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settleButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
  },
  expenseCard: {
    backgroundColor: Colors.surfaceAlt,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  expenseDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  expenseDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  paidBy: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
  },
  userShareBox: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  userShareText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 32,
    color: Colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settleModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  settleModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  settleModalAmount: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: 24,
  },
  settleModalLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  paymentButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 12,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
