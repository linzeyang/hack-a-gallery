"""Multi-agent orchestration service (future expansion)."""

import asyncio
import logging
import time
from typing import Any

from app.models import AgentTask, WorkflowRequest
from app.services.agent_client import AgentCoreClient, AgentRegistry

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates execution of multiple agents.

    Supports different execution patterns:
    - Sequential: Execute agents one after another
    - Parallel: Execute multiple agents concurrently
    - Conditional: Execute agents based on previous results
    """

    def __init__(self):
        self.client = AgentCoreClient()

    async def execute_workflow(self, workflow: WorkflowRequest) -> dict[str, Any]:
        """
        Execute a multi-agent workflow.

        Args:
            workflow: Workflow definition with tasks and execution pattern

        Returns:
            Aggregated results from all agents
        """
        start_time = time.time()

        if workflow.workflow_type == "sequential":
            results = await self._execute_sequential(workflow.tasks)
        elif workflow.workflow_type == "parallel":
            results = await self._execute_parallel(workflow.tasks)
        elif workflow.workflow_type == "conditional":
            results = await self._execute_conditional(workflow.tasks)
        else:
            raise ValueError(f"Unknown workflow type: {workflow.workflow_type}")

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "results": results,
            "execution_order": list(results.keys()),
            "total_time_ms": elapsed_ms,
        }

    async def _execute_sequential(self, tasks: list[AgentTask]) -> dict[str, Any]:
        """Execute tasks one after another."""
        results = {}

        for task in tasks:
            logger.info(f"Executing task: {task.agent_name}")

            # Resolve dependencies
            input_data = self._resolve_dependencies(task, results)

            # Get agent ARN
            agent_arn = AgentRegistry.get_agent_arn(task.agent_name)

            # Invoke agent
            result = await self.client.invoke_agent(agent_arn, input_data)
            results[task.agent_name] = result

        return results

    async def _execute_parallel(self, tasks: list[AgentTask]) -> dict[str, Any]:
        """Execute tasks concurrently."""
        # Group tasks by dependency level
        task_groups = self._group_by_dependencies(tasks)
        results = {}

        for group in task_groups:
            # Execute all tasks in this group concurrently
            group_tasks = [self._execute_task(task, results) for task in group]
            group_results = await asyncio.gather(*group_tasks)

            # Merge results
            for task, result in zip(group, group_results):
                results[task.agent_name] = result

        return results

    async def _execute_conditional(self, tasks: list[AgentTask]) -> dict[str, Any]:
        """Execute tasks based on conditions from previous results."""
        results = {}

        for task in tasks:
            # Check if dependencies are met
            if not self._check_dependencies(task, results):
                logger.info(f"Skipping task {task.agent_name} - dependencies not met")
                continue

            logger.info(f"Executing task: {task.agent_name}")

            # Resolve dependencies
            input_data = self._resolve_dependencies(task, results)

            # Get agent ARN
            agent_arn = AgentRegistry.get_agent_arn(task.agent_name)

            # Invoke agent
            result = await self.client.invoke_agent(agent_arn, input_data)
            results[task.agent_name] = result

        return results

    async def _execute_task(self, task: AgentTask, results: dict[str, Any]) -> Any:
        """Execute a single task."""
        input_data = self._resolve_dependencies(task, results)
        agent_arn = AgentRegistry.get_agent_arn(task.agent_name)
        return await self.client.invoke_agent(agent_arn, input_data)

    def _resolve_dependencies(self, task: AgentTask, results: dict[str, Any]) -> dict[str, Any]:
        """Resolve task dependencies and merge with input data."""
        input_data = task.input_data.copy()

        for dep in task.depends_on:
            if dep in results:
                input_data[f"{dep}_result"] = results[dep]

        return input_data

    def _check_dependencies(self, task: AgentTask, results: dict[str, Any]) -> bool:
        """Check if all dependencies are satisfied."""
        return all(dep in results for dep in task.depends_on)

    def _group_by_dependencies(self, tasks: list[AgentTask]) -> list[list[AgentTask]]:
        """Group tasks by dependency level for parallel execution."""
        groups = []
        remaining = tasks.copy()
        completed = set()

        while remaining:
            # Find tasks with no unmet dependencies
            current_group = [
                task for task in remaining if all(dep in completed for dep in task.depends_on)
            ]

            if not current_group:
                raise ValueError("Circular dependency detected in workflow")

            groups.append(current_group)

            # Mark as completed
            for task in current_group:
                completed.add(task.agent_name)
                remaining.remove(task)

        return groups
