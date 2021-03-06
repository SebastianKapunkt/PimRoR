  class Ability
    include CanCan::Ability

    def initialize(user)
      if !user.nil? and user.role == "admin" || user.role == "manager"  
        can :manage, :all
      end

      if !user.nil? and user.users_teams.any? { |p| p.user_team_role == "manager"}
        can :manage, Team
      else
        can :read, Team
      end

      if !user.nil? and user.users_projects.any? { |p| p.user_project_role == "manager"} 
        can :manage, Project
      else
        can :read, Project
      end
    end
  end
