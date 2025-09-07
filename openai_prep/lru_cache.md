# LRU Cache 变种 - 频次优先缓存

## 题目背景
设计一个频次优先的缓存系统，能够跟踪键的访问频次，并快速找到最高频次的键。

## 第一阶段：基础实现 (15分钟)
实现一个 `FrequencyCache` 类，支持以下操作：

```python
class FrequencyCache:
    def addKey(self, key: str) -> None:
        """添加或增加键的访问频次"""
        pass

    def getCountForKey(self, key: str) -> int:
        """获取指定键的访问次数，如果键不存在返回0"""
        pass

    def getMaxFrequencyKey(self) -> str:
        """返回频次最高的键，如果为空返回空字符串"""
        pass
```

**要求：**
- `addKey`: O(log n) 时间复杂度
- `getCountForKey`: O(1) 时间复杂度
- `getMaxFrequencyKey`: O(1) 时间复杂度

**示例：**
```python
cache = FrequencyCache()
cache.addKey("a")        # {"a": 1}
cache.addKey("b")        # {"a": 1, "b": 1}
cache.getMaxFrequencyKey()  # "b" (字典序较大)
cache.addKey("a")        # {"a": 2, "b": 1}
cache.getMaxFrequencyKey()  # "a" (频次更高)
```

## 第二阶段：优先级规则 (10分钟)
现在优先级规则需要调整：
1. 首先按频次降序排列
2. 频次相同时，按键的字典序升序排列（与第一阶段相反）

**追问：** 如果未来优先级规则可能经常变化，你会如何设计？

## 第三阶段：动态优先级 (15分钟)
系统现在需要支持动态调整优先级规则：

```python
def setPriorityRule(self, rule_func) -> None:
    """设置新的优先级比较函数"""
    pass
```

其中 `rule_func(item1, item2)` 返回 True 表示 item1 优先级更高。

**追问：**
1. 当优先级规则改变时，如何高效地重新组织数据结构？
2. 时间复杂度如何变化？

## 第四阶段：容量限制 (10分钟)
添加容量限制功能：

```python
def __init__(self, capacity: int):
    """初始化指定容量的缓存"""
    pass

def addKey(self, key: str) -> str:
    """返回被移除的键（如果有），否则返回空字符串"""
    pass
```

当容量满时，移除优先级最低的键。

## 第五阶段：性能优化 (10分钟)
**场景：** 系统需要处理高并发访问，可能有以下pattern：
- 大量重复键的访问
- 频繁的优先级查询
- 偶尔的优先级规则变更

**追问：**
1. 如何优化频繁的 heap 调整操作？
2. 能否用其他数据结构替代 heap 来提升性能？
3. 如何处理并发安全问题？

## 评分标准

### 优秀 (90-100分)
- 正确实现所有阶段功能
- 数据结构选择合理（heap + hashmap）
- 能够处理边界情况
- 对动态优先级有深入思考
- 提出合理的性能优化方案

### 良好 (70-89分)
- 基础功能实现正确
- 理解数据结构的选择原因
- 能够分析时间复杂度
- 对优先级变更有基本理解

### 一般 (50-69分)
- 基础功能大部分正确
- 数据结构使用基本合理
- 需要提示才能处理复杂场景

### 需要改进 (<50分)
- 基础功能实现有误
- 对数据结构理解不足
- 无法分析复杂度

## 常见陷阱
1. **heap 位置维护：** 忘记在 swap 时更新位置映射
2. **边界情况：** 空缓存时的 getMaxFrequencyKey
3. **优先级变更：** 没有考虑到需要重建整个 heap
4. **容量限制：** 忘记处理移除元素时的位置映射清理

## 扩展讨论
- 如果需要支持 `removeKey` 操作怎么办？
- 如果需要获取前 K 个高频键怎么办？
- 如何实现频次衰减（时间窗口内的频次）？

## 参考解法与设计思路 (Reference Solution & Design Rationale)

这道题的核心是构建一个能够高效（O(log n)）更新和查询（O(1)）最高优先级元素的数据结构。虽然看似简单，但对动态优先级、容量限制等追问，考察了代码设计的灵活性和扩展性。

### 核心数据结构 (Core Data Structures)

最优解法是 **自定义堆 (Heap) + 哈希表 (Hash Map)** 的组合。

1.  **哈希表 (`self.items`)**:
    *   **作用**: 存储每个 `key` 对应的 `Item` 对象（包含 `key` 和 `count`）。
    *   **优势**: 提供了 O(1) 时间复杂度的 `getCountForKey` 查询。同时，它也是连接外部 `key` 和内部 `PriorityHeap` 的桥梁。

2.  **自定义优先级堆 (`self.heap`)**:
    *   **作用**: 作为一个最大堆（Max Heap），它根据设定的优先级规则来组织所有 `Item`。堆顶永远是当前优先级最高的元素，这使得 `getMaxFrequencyKey` 操作的时间复杂度为 O(1)。
    *   **关键挑战**: 传统的堆（如 Python 的 `heapq`）不支持高效的 O(log n) 内部元素更新。当一个 key 的频次增加时，我们需要在堆中找到它并调整其位置。线性搜索这个 key 需要 O(n) 时间，这不满足题目要求。
    *   **解决方案**: 为了实现 O(log n) 更新，我们的 `PriorityHeap` 内部需要一个额外的 **位置哈希表 (`self.positions`)**。这个表记录了每个 `key` 在堆数组中的索引。
        *   当 `addKey` 更新一个元素的 `count` 时，我们可以通过 `self.items` 找到 `Item`，然后通过 `self.heap.positions` 在 O(1) 时间内定位到它在堆中的位置，最后执行 O(log n) 的 `_sift_up` 操作来恢复堆的性质。
        *   当交换堆中元素时，必须同步更新 `positions` 表。这是最容易出错的地方。

### 设计要点 (Design Highlights)

1.  **优先级规则解耦 (Decoupling Priority Rules)**:
    *   将优先级比较逻辑从 `Item` 类中分离出来，变成一个可传入的函数 (`rule_func`)。
    *   `FrequencyCache` 和 `PriorityHeap` 都持有一个对当前 `priority_rule` 函数的引用。
    *   当调用 `setPriorityRule` 时，只需更新这个函数引用，并对整个堆进行一次 O(n) 的重建（re-heapify），即可应用新的排序逻辑。这比修改类定义然后重新创建所有对象要灵活得多。

2.  **容量与驱逐策略 (Capacity and Eviction)**:
    *   当缓存达到容量上限时，需要驱逐优先级最低的元素。
    *   在最大堆中找到最小元素是一个 O(n) 操作（需要遍历所有叶子节点）。对于需要频繁驱逐的场景，更优化的方案是同时维护一个最小堆（Min Heap），专门用于 O(1) 查找和 O(log n) 删除优先级最低的元素。
    *   本解法为了简化，采用了 O(n) 的查找方法 `find_lowest_priority_item`，因为它只在添加新元素且容量已满时触发。

3.  **代码结构 (Code Structure)**:
    *   `Item`: 纯粹的数据容器。
    *   `PriorityHeap`: 封装了所有复杂的堆操作和位置管理，对主类隐藏了实现细节。
    *   `FrequencyCache`: 作为主接口，协调 `items` 字典和 `PriorityHeap` 来完成所有功能。

### 完整实现 (Complete Implementation)

```python
import sys

"""
This file provides a solution to the Frequency Cache problem described in lru_cache.md.
The implementation handles all phases of the problem, including:
1. Basic frequency counting with a heap.
2. Handling complex priority rules (frequency, lexicographical order).
3. Support for dynamic, user-defined priority rules.
4. Capacity limits and eviction of the lowest-priority item.
"""

# Default priority rule: Higher frequency is higher priority.
# For ties in frequency, larger key (lexicographically) is higher priority.
def default_priority_rule(item1, item2):
    """
    Returns True if item1 has higher priority than item2.
    """
    if item1.count != item2.count:
        return item1.count > item2.count
    return item1.key > item2.key

class Item:
    """A simple data class to hold the key and its count."""
    def __init__(self, key, count=0):
        self.key = key
        self.count = count

    def __repr__(self):
        return f"Item(key={self.key}, count={self.count})"

class PriorityHeap:
    """
    A custom heap implementation that supports O(log n) updates and removals.
    It uses a dictionary to keep track of the position of each key in the heap,
    which is crucial for efficient updates.
    """
    def __init__(self, priority_rule):
        self.heap = []
        self.positions = {}
        self.priority_rule = priority_rule

    def _swap(self, i, j):
        """Swaps two elements in the heap and updates their positions."""
        item1_key = self.heap[i].key
        item2_key = self.heap[j].key

        self.positions[item1_key], self.positions[item2_key] = j, i
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    def _sift_up(self, i):
        """Moves an element up the heap to its correct position."""
        parent_idx = (i - 1) // 2
        while i > 0 and self.priority_rule(self.heap[i], self.heap[parent_idx]):
            self._swap(i, parent_idx)
            i = parent_idx
            parent_idx = (i - 1) // 2

    def _sift_down(self, i):
        """Moves an element down the heap to its correct position."""
        max_index = i
        left_child_idx = 2 * i + 1
        right_child_idx = 2 * i + 2

        if left_child_idx < len(self.heap) and self.priority_rule(self.heap[left_child_idx], self.heap[max_index]):
            max_index = left_child_idx

        if right_child_idx < len(self.heap) and self.priority_rule(self.heap[right_child_idx], self.heap[max_index]):
            max_index = right_child_idx

        if i != max_index:
            self._swap(i, max_index)
            self._sift_down(max_index)

    def push(self, item):
        """Adds a new item to the heap."""
        self.heap.append(item)
        self.positions[item.key] = len(self.heap) - 1
        self._sift_up(len(self.heap) - 1)

    def pop(self):
        """Removes and returns the highest-priority item from the heap."""
        if not self.heap:
            return None

        root_item = self.heap[0]
        if len(self.heap) > 1:
            last_item = self.heap.pop()
            del self.positions[root_item.key]
            self.heap[0] = last_item
            self.positions[last_item.key] = 0
            self._sift_down(0)
        else:
            self.heap.pop()
            del self.positions[root_item.key]

        return root_item

    def update(self, key):
        """
        To be called when an item's priority might have changed.
        It finds the item and re-heapifies it.
        """
        if key not in self.positions:
            return
        idx = self.positions[key]
        # An item's priority only increases in this problem, so we only need to sift up.
        self._sift_up(idx)

    def remove(self, key):
        """Removes an item from the heap by its key in O(log n)."""
        if key not in self.positions:
            return None

        idx_to_remove = self.positions[key]

        self._swap(idx_to_remove, len(self.heap) - 1)

        item_removed = self.heap.pop()
        del self.positions[key]

        # If the removed item was not the last one, we need to fix the heap
        if idx_to_remove < len(self.heap):
            # We don't know if the swapped element should go up or down, so try both.
            self._sift_up(idx_to_remove)
            self._sift_down(idx_to_remove)

        return item_removed

    def peek(self):
        """Returns the highest-priority item without removing it."""
        return self.heap[0] if self.heap else None

    def find_lowest_priority_item(self):
        """
        Finds the item with the lowest priority.
        This is an O(n) operation. For a more performant solution
        for frequent evictions, a second min-heap would be required.
        """
        if not self.heap:
            return None

        # The lowest priority items in a max-heap are always at the leaf nodes.
        # We only need to check the second half of the array.
        start_index = len(self.heap) // 2
        if start_index == 0 and len(self.heap) > 0:
             return self.heap[0]
        if start_index >= len(self.heap):
             return None

        lowest_item = self.heap[start_index]
        for i in range(start_index + 1, len(self.heap)):
            if self.priority_rule(lowest_item, self.heap[i]):
                lowest_item = self.heap[i]
        return lowest_item

    def set_priority_rule(self, new_rule):
        """Updates the priority rule and rebuilds the entire heap in O(n)."""
        self.priority_rule = new_rule
        # Rebuild the heap from the bottom up.
        for i in range((len(self.heap) // 2) - 1, -1, -1):
            self._sift_down(i)

    def __len__(self):
        return len(self.heap)

class FrequencyCache:
    """
    A frequency-based cache that supports dynamic priority rules and a capacity limit.
    """
    def __init__(self, capacity=sys.maxsize):
        self.capacity = capacity
        self.items = {}  # key -> Item(key, count)
        # The default rule is used for initialization.
        self.priority_rule = default_priority_rule
        self.heap = PriorityHeap(self.priority_rule)

    def addKey(self, key: str) -> str:
        """
        Adds a key to the cache or increments its frequency.
        If the cache is full, it evicts the lowest-priority item.
        Returns the key of the evicted item, or an empty string if no item was evicted.
        """
        evicted_key = ""
        if key not in self.items:
            if len(self.heap) >= self.capacity:
                item_to_evict = self.heap.find_lowest_priority_item()
                if item_to_evict:
                    self.heap.remove(item_to_evict.key)
                    del self.items[item_to_evict.key]
                    evicted_key = item_to_evict.key

            new_item = Item(key, 1)
            self.items[key] = new_item
            self.heap.push(new_item)
        else:
            item = self.items[key]
            item.count += 1
            self.heap.update(key)

        return evicted_key

    def getCountForKey(self, key: str) -> int:
        """Returns the frequency count for a given key."""
        return self.items[key].count if key in self.items else 0

    def getMaxFrequencyKey(self) -> str:
        """Returns the key with the highest priority."""
        item = self.heap.peek()
        return item.key if item else ""

    def setPriorityRule(self, rule_func):
        """
        Sets a new priority rule for the cache and rebuilds the heap.
        The rule_func(item1, item2) should return True if item1 has higher priority.
        """
        self.priority_rule = rule_func
        self.heap.set_priority_rule(self.priority_rule)

# --- Example Usage and Tests ---

# Phase 1: Basic functionality
print("--- Phase 1: Basic ---")
cache = FrequencyCache()
cache.addKey("a")
cache.addKey("b")
# Tie in count, "b" > "a" lexicographically
assert cache.getMaxFrequencyKey() == "b"
cache.addKey("a")  # a count becomes 2
assert cache.getMaxFrequencyKey() == "a"
assert cache.getCountForKey("a") == 2
assert cache.getCountForKey("b") == 1
assert cache.getCountForKey("c") == 0
print("Phase 1 Passed!")

# Phase 2 & 3: Dynamic priority rule
print("\n--- Phase 2 & 3: Dynamic Priority ---")
cache = FrequencyCache()
cache.addKey("a")
cache.addKey("b")
# Default rule: b > a
assert cache.getMaxFrequencyKey() == "b"

# New rule: frequency desc, then key asc
def new_rule(item1, item2):
    if item1.count != item2.count:
        return item1.count > item2.count
    return item1.key < item2.key # Note the '<'

cache.setPriorityRule(new_rule)
# Tie in count, 'a' < 'b' so 'a' has higher priority now
assert cache.getMaxFrequencyKey() == "a"
cache.addKey("b") # b count becomes 2
assert cache.getMaxFrequencyKey() == "b"
print("Phase 2 & 3 Passed!")

# Phase 4: Capacity limit
print("\n--- Phase 4: Capacity Limit ---")
# Use the new rule (key asc for ties)
cache = FrequencyCache(capacity=2)
cache.setPriorityRule(new_rule)
cache.addKey("a") # a:1
cache.addKey("b") # b:1, a:1 -> max is 'a' due to rule
assert cache.getMaxFrequencyKey() == "a"
# Add 'c', capacity is full.
# Eviction check: 'a' and 'b' have count 1. 'b' has lower priority (b > a).
# So 'b' should be evicted.
evicted = cache.addKey("c") # c:1. Evicts 'b'.
assert evicted == "b"
assert cache.getCountForKey("b") == 0
assert "b" not in cache.items
# State: {a:1, c:1}. Max is 'a' (a < c).
assert cache.getMaxFrequencyKey() == "a"
cache.addKey("c") # State: {a:1, c:2}. Max is 'c'.
assert cache.getMaxFrequencyKey() == "c"
print("Phase 4 Passed!")

print("\n--- Additional Tests ---")
c = FrequencyCache()
assert c.getMaxFrequencyKey() == ""
c.addKey(1)
assert c.getMaxFrequencyKey() == 1
c.addKey(2)
# Default rule: 2 > 1
assert c.getMaxFrequencyKey() == 2
c.addKey(2)
assert c.getMaxFrequencyKey() == 2
c.addKey(3)
# State {1:1, 2:2, 3:1}. Max is 2.
assert c.getMaxFrequencyKey() == 2
c.addKey(3)
# State {1:1, 2:2, 3:2}. Max is 3 (3 > 2)
assert c.getMaxFrequencyKey() == 3
c.addKey(3)
# State {1:1, 2:2, 3:3}. Max is 3.
assert c.getMaxFrequencyKey() == 3
c.addKey(1)
c.addKey(1)
# State {1:3, 2:2, 3:3}. Max is 3 (tie, 3 > 1)
assert c.getMaxFrequencyKey() == 3
c.addKey(1)
# State {1:4, 2:2, 3:3}. Max is 1.
assert c.getMaxFrequencyKey() == 1
assert c.getCountForKey(1) == 4
assert c.getCountForKey(2) == 2
assert c.getCountForKey(3) == 3
print("Additional Tests Passed!")
```
